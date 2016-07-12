'use strict';

module.exports.upsertAgg = function upsertAgg(tableCode, data){

    let sql = `

INSERT INTO "t_agg_${ tableCode }" (
    id,
    mac, 
    sid,
    type,
    description,
    avg,
    stddev,
    n,
    ts,
    battery
)
VALUES

    `;

    let i = 0;
    const l = data.length;
    for (; i < l; ++i){

        sql += `
(
     ${ data[i]['id']         },
    '${ data[i]['mac']        }',
     ${ data[i]['sid']        },
    '${ data[i]['type']       }',
    '${ data[i]['desc']       }',
     ${ data[i]['avg']        },
     ${ data[i]['stddev']     },
     ${ data[i]['n']          },
    '${ data[i]['ts']         }',
     ${ data[i]['battery']    }
),
        `;
    }

    // remove the comma in the tail (we know l > 0)
    sql = sql.trim().slice(0, -1);

    // it might happen that the row is already in the table (but the 'sync' flag wasn't set to true in the local database)
    sql += `

ON CONFLICT (id) DO UPDATE SET 
    mac = EXCLUDED.mac,
    sid = EXCLUDED.sid,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    avg = EXCLUDED.avg,
    stddev = EXCLUDED.stddev,
    n = EXCLUDED.n,
    ts = EXCLUDED.ts,
    battery = EXCLUDED.battery
RETURNING id;
`;

    return sql;
};
