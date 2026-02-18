import Array "mo:core/Array";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module StoreChecklistEntry {
    public func compareByTimestamp(a : StoreChecklistEntry, b : StoreChecklistEntry) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  var checklistEntryCounter = 0;

  public type ChecklistItem = {
    name : Text;
    photo : ?Storage.ExternalBlob;
  };

  public type StoreChecklistEntry = {
    id : Text;
    storeName : Text;
    submitter : Principal;
    timestamp : Int;
    items : [ChecklistItem];
  };

  public type UserProfile = {
    name : Text;
  };

  let checklistEntries = Map.empty<Text, StoreChecklistEntry>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  include MixinStorage();

  // Profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
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

  // Checklist submission
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

  // Admin Queries
  public query ({ caller }) func getAllChecklistEntries() : async [StoreChecklistEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    checklistEntries.values().toArray();
  };

  public query ({ caller }) func getEntry(entryId : Text) : async ?StoreChecklistEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    checklistEntries.get(entryId);
  };

  public query ({ caller }) func filterEntriesByStoreName(storeName : Text) : async [StoreChecklistEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    checklistEntries.values().toArray().filter(
      func(entry) {
        Text.equal(entry.storeName, storeName);
      }
    );
  };

  public query ({ caller }) func filterEntriesByUser(user : Principal) : async [StoreChecklistEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    checklistEntries.values().toArray().filter(
      func(entry) {
        entry.submitter == user;
      }
    );
  };

  public query ({ caller }) func getAllEntriesSortedByNewestEntries() : async [StoreChecklistEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    checklistEntries.values().toArray().sort(StoreChecklistEntry.compareByTimestamp);
  };

  public query ({ caller }) func getAllEntriesSortedByStore(storeName : Text) : async [StoreChecklistEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let filtered = checklistEntries.values().toArray().filter(
      func(entry) {
        Text.equal(entry.storeName, storeName);
      }
    );
    filtered.sort(StoreChecklistEntry.compareByTimestamp);
  };

  // Check if caller has admin role
  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };
};
