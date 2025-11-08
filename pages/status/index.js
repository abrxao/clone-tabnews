import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const body = await response.json();
  return body;
}

export default function Status() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}
function UpdatedAt() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
  if (isLoading && !data) {
    return <></>;
  }
  if (data.status_code && data.status_code != 200) {
    return <></>;
  }
  const { updated_at } = data;

  const updatedAtText = new Date(updated_at).toISOString("fr-FR");
  return (
    <div>
      <p>Last update: {updatedAtText}</p>
    </div>
  );
}

function DatabaseStatus() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  if (isLoading && !data) {
    return <h2>Loading...</h2>;
  }
  if (data.status_code && data.status_code != 200) {
    return <h2>Error connecting to the Database</h2>;
  }

  const {
    dependencies: {
      database: { version, opened_connections, max_connections },
    },
  } = data;

  return (
    <div>
      <h3>Database</h3>
      <p>Version: {version}</p>
      <p>Opened connections: {opened_connections}</p>
      <p>Max connections: {max_connections}</p>
    </div>
  );
}
