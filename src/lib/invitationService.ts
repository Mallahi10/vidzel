import { supabase } from "@/lib/supabaseClient";
// AJOUTÉ [Notifications Supabase] : pour insérer une notification après invitation
import { addNotification } from "@/lib/notifications";

/* ============================================================
   TYPES — correspondent exactement aux colonnes Supabase
============================================================ */

export type InvitationStatus = "pending" | "accepted" | "declined";
export type MemberRole = "admin" | "member" | "reviewer";

export type Invitation = {
  id: string;
  workspace_id: string;
  invited_by: string;
  invited_email: string;
  invited_user_id: string | null;
  internal_role: MemberRole;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
  // MODIFIÉ [Task 4] : join étendu — workspace + project pour affichage des détails
  workspaces?: {
    title: string;
    projects?: {
      title: string | null;
      description: string | null;
      tasks: string | null;
      category: string | null;
      location: string | null;
      organization_email: string | null;
      roles: string[] | null;
    } | null;
  } | null;
};


/* ============================================================
   SEND INVITATION
   L'org envoie une invitation par email à un utilisateur.
   INSERT dans la table invitations.
   Retourne la ligne créée ou null si erreur.
============================================================ */

export async function sendInvitation(
  workspaceId: string,
  invitedEmail: string,
  internalRole: MemberRole,
  invitedBy: string
): Promise<Invitation | null> {
  const normalizedEmail = invitedEmail.toLowerCase().trim();

  // Anti-doublon: block if a pending invitation already exists for this email + workspace
  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("invited_email", normalizedEmail)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    console.warn("[sendInvitation] duplicate: pending invitation already exists");
    return null;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      workspace_id:  workspaceId,
      invited_by:    invitedBy,
      invited_email: normalizedEmail,
      internal_role: internalRole,
      status:        "pending",
      expires_at:    expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[sendInvitation]", error.message);
    return null;
  }

  // AJOUTÉ [Notifications Supabase] : envoyer une notification à l'invité
  // Chercher le profil de l'invité par email pour obtenir son user_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", invitedEmail.toLowerCase().trim())
    .maybeSingle();

  // Si le profil existe, insérer la notification — sinon on l'ignore (compte pas encore créé)
  if (profile?.id) {
    await addNotification({
      user_id:      profile.id,
      type:         "invitation",
      title:        "New Workspace Invitation",
      message:      `You have been invited to join a workspace. Go to My Invitations to accept or decline.`,
      workspace_id: workspaceId,
      project_id:   null,
      is_read:      false,
    });
  }

  // Envoyer un email à l'invité via Resend
  await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to:      normalizedEmail,
      subject: "You have been invited to a workspace on Vidzel",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#f8fafc;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#1e3a5f,#395886,#638ECB);border-radius:10px;padding:1.5rem 2rem;margin-bottom:1.5rem;">
            <h1 style="color:white;margin:0;font-size:1.4rem;font-weight:800;">Vidzel</h1>
            <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:0.85rem;">Collaborative Impact Platform</p>
          </div>
          <h2 style="color:#0f172a;margin:0 0 0.75rem;">You've been invited!</h2>
          <p style="color:#334155;line-height:1.6;margin:0 0 1rem;">
            You have been invited to join a workspace on <strong>Vidzel</strong> as a <strong>${internalRole}</strong>.
          </p>
          <p style="color:#334155;line-height:1.6;margin:0 0 1.5rem;">
            Log in to your account to view the invitation details and accept or decline.
          </p>
          <a href="https://vidzel.vercel.app/dashboard/invitations"
             style="display:inline-block;padding:0.75rem 1.75rem;background:#395886;color:white;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.95rem;">
            View My Invitations →
          </a>
          <p style="margin-top:2rem;color:#94a3b8;font-size:0.8rem;border-top:1px solid #e2e8f0;padding-top:1rem;">
            This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.
          </p>
        </div>
      `,
    }),
  }).catch((err) => console.error("[sendInvitation] email error:", err)); // log but don't block

  return data as Invitation;
}


/* ============================================================
   GET ORG INVITATIONS
   Retourne toutes les invitations envoyées pour un workspace.
   Utilisé par l'org pour voir le statut de ses invitations.
============================================================ */

export async function getOrgInvitations(
  workspaceId: string
): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getOrgInvitations]", error.message);
    return [];
  }

  return data as Invitation[];
}


/* ============================================================
   GET MY INVITATIONS
   Retourne toutes les invitations reçues par l'utilisateur connecté.
   La recherche se fait par email (invited_email = email du profil).
   Utilisé par la page /dashboard/invitations (côté invité).
============================================================ */

export async function getMyInvitations(
  userEmail: string
): Promise<Invitation[]> {
  // Use the server-side API route so the service role key can bypass RLS.
  // Pending invitees are not yet workspace members, so the normal Supabase
  // client cannot read workspace/project details before they accept.
  try {
    const res = await fetch(
      `/api/invitations?email=${encodeURIComponent(userEmail.toLowerCase().trim())}`
    );
    if (!res.ok) {
      console.error("[getMyInvitations] API error:", res.status);
      return [];
    }
    const { data } = await res.json();
    return (data ?? []) as Invitation[];
  } catch (err) {
    console.error("[getMyInvitations]", err);
    return [];
  }
}


/* ============================================================
   ACCEPT INVITATION
   Deux opérations dans l'ordre :
   1. UPDATE invitations → status='accepted', invited_user_id=userId
   2. INSERT workspace_members → ajoute l'invité comme membre actif
   ON CONFLICT DO NOTHING sur workspace_members pour éviter les doublons.
   Retourne true si succès, false si erreur.
============================================================ */

export async function acceptInvitation(
  invitationId: string,
  workspaceId: string,
  internalRole: MemberRole,
  userId: string
): Promise<boolean> {
  // Verify invitation is still pending and not expired
  const { data: invite } = await supabase
    .from("invitations")
    .select("status, expires_at")
    .eq("id", invitationId)
    .maybeSingle();

  if (!invite || invite.status !== "pending") {
    console.warn("[acceptInvitation] invitation not found or already responded");
    return false;
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    console.warn("[acceptInvitation] invitation has expired");
    return false;
  }

  // Étape 1 — marquer l'invitation comme acceptée
  const { error: inviteError } = await supabase
    .from("invitations")
    .update({
      status:          "accepted",
      invited_user_id: userId,
      responded_at:    new Date().toISOString(),
    })
    .eq("id", invitationId);

  if (inviteError) {
    console.error("[acceptInvitation] update invitation:", inviteError.message);
    return false;
  }

  // Étape 2 — ajouter l'utilisateur dans workspace_members
  // MODIFIÉ : INSERT simple au lieu de upsert — le upsert faisait un UPDATE
  // quand la ligne existait déjà, bloqué par RLS (UPDATE réservé à l'org).
  // L'erreur 23505 (unique_violation = déjà membre) est ignorée volontairement.
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id:  workspaceId,
      user_id:       userId,
      internal_role: internalRole,
      status:        "active",
    });

  if (memberError && memberError.code !== "23505") {
    console.error("[acceptInvitation] insert member:", memberError.message);
    return false;
  }

  return true;
}


/* ============================================================
   DECLINE INVITATION
   UPDATE invitations → status='declined', responded_at=now()
   Retourne true si succès, false si erreur.
============================================================ */

export async function declineInvitation(
  invitationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("invitations")
    .update({
      status:       "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", invitationId);

  if (error) {
    console.error("[declineInvitation]", error.message);
    return false;
  }

  return true;
}
