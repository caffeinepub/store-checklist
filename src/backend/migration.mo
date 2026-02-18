import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Storage "blob-storage/Storage";

module {
  // The old actor type includes the admin credentials that were removed in the new version
  type OldActor = {
    adminUserId : Text;
    adminPassword : Text;
    userProfiles : Map.Map<Principal, { name : Text }>;
    checklistEntries : Map.Map<Text, {
      id : Text;
      storeName : Text;
      submitter : Principal;
      timestamp : Int;
      items : [{
        name : Text;
        photo : ?Storage.ExternalBlob;
      }];
    }>;
  };

  // The new actor type excludes the admin credentials
  type NewActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    checklistEntries : Map.Map<Text, {
      id : Text;
      storeName : Text;
      submitter : Principal;
      timestamp : Int;
      items : [{
        name : Text;
        photo : ?Storage.ExternalBlob;
      }];
    }>;
  };

  public func run(old : OldActor) : NewActor {
    // Simply drop the admin credential variables during migration
    {
      userProfiles = old.userProfiles;
      checklistEntries = old.checklistEntries;
    };
  };
};
