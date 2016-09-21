
0) BACKUP!

1) install versioning manually

0020_pg_versioning.sql


2) manually the insert initial patch  (for each client); this will make sure the code that creates the database is not run


INSERT INTO _v.patches (
    patch_name,
    applied_tsz,
    applied_by,
    requires,
    conflicts,
    description )
VALUES (
    'premiere-t_measurements-0001',
    now(),
    current_user,
    coalesce( NULL, '{}'::text[] ),
    coalesce( NULL, '{}'::text[] ),
    'initial database design - 0001');

INSERT INTO _v.patches (
    patch_name,
    applied_tsz,
    applied_by,
    requires,
    conflicts,
    description )
VALUES (
    'premiere-t_measurements-0002',
    now(),
    current_user,
    coalesce( NULL, '{}'::text[] ),
    coalesce( NULL, '{}'::text[] ),
    'initial database design - 0002');

3) rename the t_log_state_XXXX tables, delete old sequences

ALTER TABLE t_log_state_0001 RENAME TO t_log_state_0001_old;
ALTER TABLE t_log_state_0002 RENAME TO t_log_state_0002_old;


SELECT c.relname FROM pg_class c WHERE c.relkind = 'S';
DROP SEQUENCE name;

4) execute the script runner - 
    will run all the canonical patches
    will create the new version of t_log_state
    will drop the column "agg" in t_measurements




5) the port has been changed - we have to change nginx as well


