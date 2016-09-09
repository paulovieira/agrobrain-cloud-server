DO $$

DECLARE
patch_exists int := _v.register_patch('premiere', 'initial database design');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;



/*** BEGIN CODE FOR CHANGES  ***/


create table if not exists t_agg(
    id int primary key,
    
    mac text not null,
    sid smallint not null,
    type text not null,
    description text,
    avg real,
    stddev real,
    n smallint,

    ts timestamptz not null default now(),
    battery smallint,
    sync jsonb default '{}'
);


/*** END CODE FOR CHANGES  ***/



END;
$$;