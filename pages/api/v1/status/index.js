function status(req, response) {
  response.status(200).json({ msg_crn: "tiamo" });
}

export default status;
