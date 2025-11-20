SELECT citus_set_coordinator_host('citus_coordinator_ad', 5432);
SELECT citus_add_node('citus_worker1_ad', 5432);
SELECT citus_add_node('citus_worker2_ad', 5432);
