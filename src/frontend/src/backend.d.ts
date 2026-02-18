import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ChecklistItem {
    name: string;
    photo?: ExternalBlob;
}
export interface StoreChecklistEntry {
    id: string;
    submitter: Principal;
    storeName: string;
    timestamp: bigint;
    items: Array<ChecklistItem>;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createChecklistEntry(storeName: string, items: Array<ChecklistItem>): Promise<string>;
    filterEntriesByStoreName(storeName: string): Promise<Array<StoreChecklistEntry>>;
    filterEntriesByUser(user: Principal): Promise<Array<StoreChecklistEntry>>;
    getAllChecklistEntries(): Promise<Array<StoreChecklistEntry>>;
    getAllEntriesSortedByNewestEntries(): Promise<Array<StoreChecklistEntry>>;
    getAllEntriesSortedByStore(storeName: string): Promise<Array<StoreChecklistEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEntry(entryId: string): Promise<StoreChecklistEntry | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasAdminRole(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    login(username: string, password: string): Promise<boolean>;
    ping(): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
