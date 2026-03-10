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
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";
import type {
  Organization,
  OrganizationRequest,
  OrganizationMember,
} from "../types";
import { useAuth } from "../context/AuthContext";

export function useOrganizations() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to all organizations to keep lists updated
  useEffect(() => {
    const q = query(collection(db, "organizations"));
    const unsubscribe = onSnapshot(
      q,
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

    return () => unsubscribe();
  }, []);

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

  return {
    organizations,
    loading,
    error,
    createOrganization,
    requestJoinOrganization,
    acceptRequest,
    rejectRequest,
    removeMember,
  };
}
