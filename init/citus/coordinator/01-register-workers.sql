SELECT citus_set_coordinator_host('ad-pf-citus-coordinator', 5432);
SELECT citus_add_node('ad-pf-citus-worker1', 5432);
SELECT citus_add_node('ad-pf-citus-worker2', 5432);
