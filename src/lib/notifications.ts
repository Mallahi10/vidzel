// MODIFIÉ [Notifications Supabase] : toutes les fonctions migrées de localStorage vers Supabase
import { supabase } from "@/lib/supabaseClient";

/* ============================================================
   TYPE — correspond exactement aux colonnes de la table Supabase
============================================================ */
export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  workspace_id: string | null;
  is_read: boolean;
  created_at: string;
};


/* ============================================================
   GET USER NOTIFICATIONS
   Retourne toutes les notifications de l'utilisateur connecté,
   triées par date décroissante (plus récente en premier).
============================================================ */
export async function getUserNotifications(
  userId: string
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserNotifications]", error.message);
    return [];
  }

  return data as Notification[];
}


/* ============================================================
   ADD NOTIFICATION
   INSERT une notification dans Supabase.
   Utilisé par invitationService après l'envoi d'une invitation.
   Retourne true si succès, false si erreur.
============================================================ */
export async function addNotification(
  notification: Omit<Notification, "id" | "created_at">
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .insert(notification);

  if (error) {
    console.error("[addNotification]", error.message);
    return false;
  }

  return true;
}


/* ============================================================
   MARK AS READ
   UPDATE is_read = true pour une notification donnée.
   Retourne true si succès, false si erreur.
============================================================ */
export async function markNotificationRead(
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("[markNotificationRead]", error.message);
    return false;
  }

  return true;
}
