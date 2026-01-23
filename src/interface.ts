export interface Member {
  user_id: string;
  display_name: string;
}

export interface Prayer {
  user_id: string;
  text: string;
}

export enum ButType {
  ADD_PRAYER = "add_prayer",
  VIEW_TODAY = "VIEW_DATE",
}

export interface PrayerWithMember {
  user_id: string;
  text: string;
  display_name: string;
}
