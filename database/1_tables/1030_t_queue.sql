DO $$

DECLARE
patch_exists int := _v.register_patch('160929-1', 't_queue');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/



create table t_queue_XXXX( 
    id int primary key,

    job_type text,
    data jsonb,
    ts_created timestamptz,
    delay int, -- delay to execute the job
    ts_executed timestamptz,

    sync jsonb default '{}'
);

/*** END CODE FOR CHANGES  ***/

END;
$$;
