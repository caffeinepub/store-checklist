import List "mo:core/List";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";
import Array "mo:core/Array";
import Int "mo:core/Int";
import MixinStorage "blob-storage/Mixin";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Shared admin credentials
  let adminUserId = "Admin";
  let adminPassword = "Admin";

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
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Checklist submission
  public shared ({ caller }) func createChecklistEntry(storeName : Text, items : [ChecklistItem]) : async Text {
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

  public query ({ caller }) func getAllChecklistEntries(userId : Text, password : Text) : async [StoreChecklistEntry] {
    adminCheck(userId, password);
    checklistEntries.values().toArray();
  };

  public query ({ caller }) func getEntry(userId : Text, password : Text, entryId : Text) : async ?StoreChecklistEntry {
    adminCheck(userId, password);
    checklistEntries.get(entryId);
  };

  public query ({ caller }) func filterEntriesByStoreName(userId : Text, password : Text, storeName : Text) : async [StoreChecklistEntry] {
    adminCheck(userId, password);
    checklistEntries.values().toArray().filter(
      func(entry) {
        Text.equal(entry.storeName, storeName);
      }
    );
  };

  public query ({ caller }) func filterEntriesByUser(userId : Text, password : Text, user : Principal) : async [StoreChecklistEntry] {
    adminCheck(userId, password);
    checklistEntries.values().toArray().filter(
      func(entry) {
        entry.submitter == user;
      }
    );
  };

  public query ({ caller }) func getAllEntriesSortedByNewestEntries(userId : Text, password : Text) : async [StoreChecklistEntry] {
    adminCheck(userId, password);
    checklistEntries.values().toArray().sort(StoreChecklistEntry.compareByTimestamp);
  };

  public query ({ caller }) func getAllEntriesSortedByStore(userId : Text, password : Text, storeName : Text) : async [StoreChecklistEntry] {
    adminCheck(userId, password);
    let filtered = checklistEntries.values().toArray().filter(
      func(entry) {
        Text.equal(entry.storeName, storeName);
      }
    );
    filtered.sort(StoreChecklistEntry.compareByTimestamp);
  };

  func adminCheck(userId : Text, password : Text) {
    if (userId != adminUserId or password != adminPassword) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };
};
