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
  // Join optionnel — workspace title pour affichage
  workspaces?: { title: string } | null;
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
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      workspace_id:  workspaceId,
      invited_by:    invitedBy,
      invited_email: invitedEmail.toLowerCase().trim(),
      internal_role: internalRole,
      status:        "pending",
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
      is_read:      false,
    });
  }

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
  const { data, error } = await supabase
    .from("invitations")
    .select("*, workspaces(title)")
    .eq("invited_email", userEmail.toLowerCase().trim())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyInvitations]", error.message);
    return [];
  }

  return data as Invitation[];
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
