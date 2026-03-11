import { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";
import type {
  Organization,
  OrganizationRequest,
  OrganizationMember,
  OrganizationProject,
  OrganizationInvite,
} from "../types";
import { useAuth } from "../context/AuthContext";

export function useOrganizations() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to all organizations to keep lists updated
  useEffect(() => {
    const qOrgs = query(collection(db, "organizations"));
    const unsubscribeOrgs = onSnapshot(
      qOrgs,
      (snapshot) => {
        const orgs: Organization[] = [];
        snapshot.forEach((doc) => {
          orgs.push({ id: doc.id, ...doc.data() } as Organization);
        });
        setOrganizations(orgs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching organizations:", err);
        setError("Failed to load organizations.");
        setLoading(false);
      },
    );

    let unsubscribeInvites = () => {};
    if (user?.email) {
      const qInvites = query(
        collection(db, "organization_invites"),
        where("email", "==", user.email),
        where("status", "==", "pending"),
      );
      unsubscribeInvites = onSnapshot(
        qInvites,
        (snapshot) => {
          const fetchedInvites: OrganizationInvite[] = [];
          snapshot.forEach((doc) => {
            fetchedInvites.push({
              id: doc.id,
              ...doc.data(),
            } as OrganizationInvite);
          });
          setInvites(fetchedInvites);
        },
        (err) => {
          console.error("Error fetching invites:", err);
        },
      );
    }

    return () => {
      unsubscribeOrgs();
      unsubscribeInvites();
    };
  }, [user?.email]);

  const createOrganization = async (name: string, description: string) => {
    if (!user) throw new Error("Must be logged in to create an organization.");

    const newOrg: Organization = {
      id: uuidv4(),
      name,
      description,
      ownerId: user.uid,
      members: [
        {
          userId: user.uid,
          userName: user.displayName,
          userEmail: user.email,
          joinedAt: Date.now(),
        },
      ],
      pendingRequests: [],
      createdAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "organizations", newOrg.id), newOrg);
    } catch (err) {
      console.error("Error creating organization:", err);
      throw new Error("Failed to create organization.");
    }
  };

  const requestJoinOrganization = async (orgId: string) => {
    if (!user) throw new Error("Must be logged in to request to join.");

    const request: OrganizationRequest = {
      userId: user.uid,
      userName: user.displayName,
      userEmail: user.email,
      requestedAt: Date.now(),
    };

    try {
      const orgRef = doc(db, "organizations", orgId);
      await updateDoc(orgRef, {
        pendingRequests: arrayUnion(request),
      });
    } catch (err) {
      console.error("Error requesting to join:", err);
      throw new Error("Failed to request to join organization.");
    }
  };

  const acceptRequest = async (orgId: string, request: OrganizationRequest) => {
    if (!user) throw new Error("Must be logged in.");

    const newMember: OrganizationMember = {
      userId: request.userId,
      userName: request.userName,
      userEmail: request.userEmail,
      joinedAt: Date.now(),
    };

    try {
      const orgRef = doc(db, "organizations", orgId);
      await updateDoc(orgRef, {
        pendingRequests: arrayRemove(request),
        members: arrayUnion(newMember),
      });
    } catch (err) {
      console.error("Error accepting request:", err);
      throw new Error("Failed to accept request.");
    }
  };

  const rejectRequest = async (orgId: string, request: OrganizationRequest) => {
    if (!user) throw new Error("Must be logged in.");

    try {
      const orgRef = doc(db, "organizations", orgId);
      await updateDoc(orgRef, {
        pendingRequests: arrayRemove(request),
      });
    } catch (err) {
      console.error("Error rejecting request:", err);
      throw new Error("Failed to reject request.");
    }
  };

  const removeMember = async (orgId: string, member: OrganizationMember) => {
    if (!user) throw new Error("Must be logged in.");

    try {
      const orgRef = doc(db, "organizations", orgId);
      await updateDoc(orgRef, {
        members: arrayRemove(member),
      });
    } catch (err) {
      console.error("Error removing member:", err);
      throw new Error("Failed to remove member.");
    }
  };

  const addProject = async (orgId: string, name: string, color: string) => {
    if (!user) throw new Error("Must be logged in.");

    const newProject: OrganizationProject = {
      id: uuidv4(),
      name,
      color,
      createdAt: Date.now(),
      createdBy: user.uid,
    };

    try {
      const orgRef = doc(db, "organizations", orgId);
      await updateDoc(orgRef, {
        projects: arrayUnion(newProject),
      });
    } catch (err) {
      console.error("Error adding project:", err);
      throw new Error("Failed to add project.");
    }
  };

  const removeProject = async (orgId: string, project: OrganizationProject) => {
    if (!user) throw new Error("Must be logged in.");

    try {
      const orgRef = doc(db, "organizations", orgId);
      await updateDoc(orgRef, {
        projects: arrayRemove(project),
      });
    } catch (err) {
      console.error("Error removing project:", err);
      throw new Error("Failed to remove project.");
    }
  };

  const inviteMember = async (
    orgId: string,
    orgName: string,
    email: string,
  ) => {
    if (!user) throw new Error("Must be logged in.");

    const inviteId = uuidv4();
    const newInvite: OrganizationInvite = {
      id: inviteId,
      orgId,
      orgName,
      email: email.trim().toLowerCase(),
      invitedAt: Date.now(),
      status: "pending",
    };

    try {
      await setDoc(doc(db, "organization_invites", inviteId), newInvite);
    } catch (err) {
      console.error("Error inviting member:", err);
      throw new Error("Failed to invite member.");
    }
  };

  const acceptInvite = async (invite: OrganizationInvite) => {
    if (!user) throw new Error("Must be logged in.");

    const newMember: OrganizationMember = {
      userId: user.uid,
      userName: user.displayName,
      userEmail: user.email,
      joinedAt: Date.now(),
    };

    try {
      // 1. Add user to org members
      const orgRef = doc(db, "organizations", invite.orgId);
      await updateDoc(orgRef, {
        members: arrayUnion(newMember),
      });

      // 2. Mark invite as accepted (or we could delete it)
      const inviteRef = doc(db, "organization_invites", invite.id);
      await updateDoc(inviteRef, {
        status: "accepted",
      });
    } catch (err) {
      console.error("Error accepting invite:", err);
      throw new Error("Failed to accept invite.");
    }
  };

  const declineInvite = async (invite: OrganizationInvite) => {
    if (!user) throw new Error("Must be logged in.");

    try {
      const inviteRef = doc(db, "organization_invites", invite.id);
      await updateDoc(inviteRef, {
        status: "declined", // or we could delete the document
      });
    } catch (err) {
      console.error("Error declining invite:", err);
      throw new Error("Failed to decline invite.");
    }
  };

  return {
    organizations,
    invites,
    loading,
    error,
    createOrganization,
    requestJoinOrganization,
    acceptRequest,
    rejectRequest,
    removeMember,
    addProject,
    removeProject,
    inviteMember,
    acceptInvite,
    declineInvite,
  };
}
