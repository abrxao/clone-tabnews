function can(user, feature) {
  let authorizaded = false;
  if (user.features.includes(feature)) {
    authorizaded = true;
  }
  return authorizaded;
}

const authorization = { can };

export default authorization;
