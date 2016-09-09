DO $$

DECLARE
patch_exists int := _v.register_patch('premiere', 'initial database design');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;



/*** BEGIN CODE FOR CHANGES  ***/


/* the difference to the respective table in the local server is that id is not serial 
(and also sync is json here while in local is just a bool, but will change)
*/

create table if not exists t_measurements(
	id int primary key,

	mac text not null,
    sid smallint not null,
    type text not null,
    description text,
    val real,

    ts timestamptz not null default now(),
    battery smallint,
    agg bool default false,
    sync jsonb default '{}'
);



/*** END CODE FOR CHANGES  ***/



END;
$$;