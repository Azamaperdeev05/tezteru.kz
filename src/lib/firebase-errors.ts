import { FirebaseError } from 'firebase/app';
import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  code?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerIds: string[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    code: error instanceof FirebaseError ? error.code : undefined,
    authInfo: {
      userId: auth.currentUser?.uid,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerIds: auth.currentUser?.providerData.map((provider) => provider.providerId) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', errInfo);
  return errInfo;
}

export function isMissingIndexError(error: unknown) {
  return error instanceof FirebaseError
    && error.code === 'failed-precondition'
    && error.message.toLowerCase().includes('requires an index');
}
