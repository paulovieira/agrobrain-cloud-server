
CREATE OR REPLACE FUNCTION upsert_log_state(data jsonb, options jsonb)
RETURNS SETOF t_log_state
AS $$

DECLARE
new_row t_log_state%rowtype;
command text;

BEGIN

IF  jsonb_typeof(data) = 'object' THEN
    data := jsonb_build_array(data);
END IF;

for new_row in (select * from jsonb_populate_recordset(null::t_log_state, data)) loop


    command := format('
        insert into %I(
            id,
            segment, 
            data,
            ts_start,
            ts_end
        )
        values ($1, $2, $3, $4, $5)
        on conflict (id) do update set
            id       = excluded.id,
            segment  = excluded.segment,
            data     = excluded.data,
            ts_start = excluded.ts_start,
            ts_end   = excluded.ts_end
        returning *; 
    ',
    't_log_state_' || (options->>'clientCode')::text
    );

    execute command
        into strict new_row
        using 
            new_row.id,
            new_row.segment,
            new_row.data,
            new_row.ts_start,
            new_row.ts_end;

    return next new_row;

end loop;

return;

END;
$$
LANGUAGE plpgsql;


/*

select * from upsert_log_state(' 
  {
    "id": 9999,
    "segment": "gpio",
    "data": {"pin": 23, "value": 0, "userId": 0},
    "ts_start": "2016-09-17T15:22:50.570Z",
    "ts_end": "2016-09-17T15:22:55.570Z"
  }
',
'{ "clientCode": "0001" }'
);


select * from upsert_log_state('[
  {
    "id": 8888,
    "segment": "gpio",
    "data": {"pin": 23, "value": 0, "userId": 0},
    "ts_start": "2016-09-17T15:22:50.570Z",
    "ts_end": "2016-09-17T15:22:55.570Z"
  },
  {
    "id": 8889,
    "segment": "connectivity",
    "data": {"value": 1},
    "ts_start": "2016-09-17T15:22:50.570Z",
    "ts_end": "2016-09-17T15:22:55.570Z"
  }
]',
'{ "clientCode": "0001" }'
);

*/