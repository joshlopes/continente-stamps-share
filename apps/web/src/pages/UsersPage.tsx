import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../api/users';

export function UsersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  if (isLoading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">Error loading users: {error.message}</div>;
  }

  return (
    <div className="users-page">
      <h1>Users</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {data?.users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.name || '-'}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Active' : 'Inactive'}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
