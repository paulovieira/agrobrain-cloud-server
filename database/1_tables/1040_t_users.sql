DO $$

DECLARE
patch_exists int := _v.register_patch('premiere', 'initial database design');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;



/*** BEGIN CODE FOR CHANGES  ***/


CREATE TABLE IF NOT EXISTS users(
	id smallserial primary key,
	email text unique not null,
	first_name text,
	last_name text,
	pw_hash text not null,

	-- permissions;
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	recover_code text,
	recover_code_expiration timestamptz not null default now()


);


/*** END CODE FOR CHANGES  ***/



END;
$$;


-- NOTE: the table contains a dummy user; it is used for events that don't below to any registered user/initiative;
