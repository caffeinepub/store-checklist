import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
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
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  public type NewActor = {
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
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    {
      checklistEntries = old.checklistEntries;
      userProfiles = old.userProfiles;
    };
  };
};
