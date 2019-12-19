export const buildKeyType = permissions => {
  if (permissions.isOwner) {
    return 'Ownership';
  } else if (permissions.isManagementProxy) {
    return 'Management';
  } else if (permissions.isSpawnProxy) {
    return 'Spawn';
  } else if (permissions.isVotingProxy) {
    return 'Voting';
  } else if (permissions.isTransferProxy) {
    return 'Transfer';
  }
};
