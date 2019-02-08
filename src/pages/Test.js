import React from 'react';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';

import Layout from '../components/Layout';
import Seo from '../components/Seo';
import apolloClient from '../utils/apolloClient';

import { fetchPosData, updatePosAddress } from '../store/posData/queries';

const query = gql`
  {
    user @client {
      id
      fullName
      email
      currency
    }
  }
`;

const loginMutation = gql`
  mutation login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) @client {
      id
    }
  }
`;
const logoutMutation = gql`
  mutation logout {
    logout @client
  }
`;

const Logout = () => (
  <Mutation mutation={logoutMutation}>
    {(logout, { loading, error }) => (
      <React.Fragment>
        <button
          type="submit"
          className={`button is-primary ${loading && 'is-loading'}`}
          onClick={() => logout()}
        >
          Logout
        </button>
        {error && <p>Error: {error.message}</p>}
      </React.Fragment>
    )}
  </Mutation>
);

class Test extends React.Component {
  state = {
    pos: {}
  };

  async componentDidMount() {
    fetchPosData().subscribe(result => {
      console.log('result fetchPosData', result);
      this.setState({ pos: result.data.pos });
    });

    apolloClient.watchQuery({ query }).subscribe(result => {
      console.log('result', result);
    });
  }

  render() {
    console.log('state', this.state);
    return (
      <Layout>
        <Seo title="Test page" description="A Test page" />
        <div className="section">
          <div className="container">
            <h2 className="title">User data:</h2>
            <Query query={query} fetchPolicy="cache-and-network">
              {({ data, loading, error }) => {
                if (loading) return <p>loading...</p>;
                if (error && !data.user) return <p>Error: {error.message}</p>;
                console.log('data.user', data.user);

                if (data.user) {
                  return (
                    <div>
                      ID: {data.user.id}
                      <br />
                      Name: {data.user.fullName}
                      <br />
                      Email: {data.user.email}
                      <br />
                      <br />
                      <Logout />
                    </div>
                  );
                }
                return <div>Not logged in</div>;
              }}
            </Query>
            <hr />
            <button
              type="submit"
              onClick={() => updatePosAddress('jkshafdkjhdkah')}
            >
              Change {this.state.pos.address}
            </button>
            <Mutation mutation={loginMutation}>
              {(login, { loading, error }) => (
                <React.Fragment>
                  <button
                    type="submit"
                    className={`button is-primary ${loading && 'is-loading'}`}
                    onClick={() =>
                      login({
                        variables: { email: 'abc@abc.com', password: 'abc123' }
                      })
                    }
                  >
                    Login
                  </button>
                  {error && <p>Error: {error.message}</p>}
                </React.Fragment>
              )}
            </Mutation>
          </div>
        </div>
      </Layout>
    );
  }
}

export default Test;
