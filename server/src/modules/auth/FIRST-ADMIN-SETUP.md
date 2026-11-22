# First administrator setup

Apply the database migrations and seed the project's roles and permissions before setup. Configure `FIRST_ADMIN_SETUP_KEY` on the API server with a unique, cryptographically random secret of at least 32 characters (up to 256). Share it privately with the person creating the first administrator; never put it in the client configuration, repository, or a URL. Use HTTPS outside localhost.

Open `/admin/setup`, enter the administrator's name, email, password and setup key, and sign in at `/admin/login` after creation. Setup creates an active System Administrator directly; it does not send an activation email or verify ownership of the entered email. Ensure the address is correct for future password recovery.

Setup is disabled if the key is missing or too short, and permanently closes for this database once any System Administrator account exists, including a suspended, deactivated or deleted account. Additional administrators must be created through Users & Roles. Remove the setup key from the server environment after completing setup. If recovery is needed after the initial account is lost, use an authorized administrative recovery process rather than reopening public setup.

The existing role seed remains necessary for role permissions. The setup key does not replace database migration, role seeding, or production security configuration.

The platform allows up to three non-deleted administrators in total, counting both System Administrator and Organisation Administrator accounts, including pending, suspended and deactivated accounts. A System Administrator can invite additional administrators from Users & Roles or assign those roles to existing users. Removing or changing an administrator's role frees a place.
