import List "mo:core/List";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  stable var checklistEntryCounter : Nat = 0;
  stable var adminBootstrapCompleted : Bool = false;

  public type ChecklistItem = {
    name : Text;
    photo : ?Storage.ExternalBlob;
  };

  module StoreChecklistEntry {
    public func compareByTimestamp(a : StoreChecklistEntry, b : StoreChecklistEntry) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  public type StoreChecklistEntry = {
    id : Text;
    storeName : Text;
    submitter : Principal;
    timestamp : Int;
    items : [ChecklistItem];
  };

  public shared ({ caller }) func login(username : Text, password : Text) : async Bool {
    // Only allow bootstrap login if no admin has been created yet
    if (adminBootstrapCompleted) {
      Runtime.trap("Unauthorized: Admin bootstrap already completed");
    };
    
    if (username == "Admin" and password == "Admin") {
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
      adminBootstrapCompleted := true;
      return true;
    };
    false;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createChecklistEntry(storeName : Text, items : [ChecklistItem]) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checklist entries");
    };
    checklistEntryCounter += 1;
    let entryId = checklistEntryCounter.toText();
    let entry : StoreChecklistEntry = {
      id = entryId;
      storeName;
      submitter = caller;
      timestamp = Time.now();
      items;
    };
    checklistEntries.add(entryId, entry);
    entryId;
  };

  public shared ({ caller }) func getAllChecklistEntries() : async [StoreChecklistEntry] {
    authorizationGuard(#admin, caller);
    checklistEntries.values().toArray();
  };

  public shared ({ caller }) func getEntry(entryId : Text) : async ?StoreChecklistEntry {
    authorizationGuard(#admin, caller);
    checklistEntries.get(entryId);
  };

  public shared ({ caller }) func filterEntriesByStoreName(storeName : Text) : async [StoreChecklistEntry] {
    authorizationGuard(#admin, caller);
    checklistEntries.values().toArray().filter(
      func(entry) {
        Text.equal(entry.storeName, storeName);
      }
    );
  };

  public shared ({ caller }) func filterEntriesByUser(user : Principal) : async [StoreChecklistEntry] {
    authorizationGuard(#admin, caller);
    checklistEntries.values().toArray().filter(
      func(entry) {
        entry.submitter == user;
      }
    );
  };

  public shared ({ caller }) func getAllEntriesSortedByNewestEntries() : async [StoreChecklistEntry] {
    authorizationGuard(#admin, caller);
    checklistEntries.values().toArray().sort(StoreChecklistEntry.compareByTimestamp);
  };

  public shared ({ caller }) func getAllEntriesSortedByStore(storeName : Text) : async [StoreChecklistEntry] {
    authorizationGuard(#admin, caller);
    let filtered = checklistEntries.values().toArray().filter(
      func(entry) {
        Text.equal(entry.storeName, storeName);
      }
    );
    filtered.sort(StoreChecklistEntry.compareByTimestamp);
  };

  public query func ping() : async Text {
    "pong";
  };

  public query ({ caller }) func hasAdminRole() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  func authorizationGuard(role : AccessControl.UserRole, caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, role))) {
      Runtime.trap("Unauthorized: Insufficient user privileges");
    };
  };

  stable let userProfiles = Map.empty<Principal, UserProfile>();
  stable let checklistEntries = Map.empty<Text, StoreChecklistEntry>();
};
