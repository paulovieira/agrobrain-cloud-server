
0) BACKUP!

1) install versioning manually

0020_pg_versioning.sql


2) manually the insert initial patch (this will make sure the code that creates the database is not run)


INSERT INTO _v.patches (
    patch_name,
    applied_tsz,
    applied_by,
    requires,
    conflicts,
    description )
VALUES (
    'premiere_XXXX',
    now(),
    current_user,
    coalesce( NULL, '{}'::text[] ),
    coalesce( NULL, '{}'::text[] ),
    'initial database design for XXXX');

3) in t_log_state we changed id from "serial primary key" to just "int primary key"


5) the port has been changed - we have to change nginx as well