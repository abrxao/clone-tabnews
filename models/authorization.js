function can(user, feature, resource) {
  let authorizaded = false;

  if (user.features.includes(feature)) {
    authorizaded = true;
  }
  if (feature == "update:user" && resource) {
    authorizaded = false;
    if (user.id == resource.id) {
      authorizaded = true;
    }
  }
  return authorizaded;
}

const authorization = { can };

export default authorization;
