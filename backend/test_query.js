const { query, getClient } = require('./src/config/db');

(async () => {
   try {
     const res = await query(`SELECT t.*, q.name as queue_name, q.prefix, q.now_serving, q.avg_service_time, q.status as queue_status,
            l.name as location_name, l.type as location_type, l.address as location_address,
            (SELECT COUNT(*) FROM tokens t2 
             WHERE t2.queue_id = t.queue_id 
             AND t2.status = 'waiting' 
             AND (
               CASE WHEN t2.priority_level = 'emergency' THEN 1 WHEN t2.priority_level = 'priority' THEN 2 ELSE 3 END 
               < 
               CASE WHEN t.priority_level = 'emergency' THEN 1 WHEN t.priority_level = 'priority' THEN 2 ELSE 3 END
               OR 
               (
                 t2.priority_level = t.priority_level
                 AND t2.position < t.position
               )
             )
            ) as people_ahead
     FROM tokens t
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE t.user_id = 1 AND t.status IN ('waiting', 'called', 'serving', 'missed')
     ORDER BY t.booked_at DESC`);
     
     console.log('SUCCESS:', res.rows.length);
   } catch(e) {
     console.error('QUERY ERROR:', e);
   }
})();
