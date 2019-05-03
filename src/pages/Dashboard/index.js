import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import gql from 'graphql-tag';

import { isNull } from 'util';
import { checkWindowSize } from '../../utils/helpers';
import apolloClient from '../../utils/apolloClient';
import MobileView from './mobile.view';
import DesktopView from './desktop.view';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';
import Payment from '../Payment';

const query = gql`
  {
    currency @client
    isLoggedIn @client
    walletAddress @client
  }
`;

const updateWalletMutation = gql`
  mutation updateWalletAddress($address: String!, $source: String) {
    updateWalletAddress(address: $address, source: $source) @client
    updateMe(input: { walletAddress: $address }) {
      id
    }
  }
`;

const createInvoiceMutation = gql`
  mutation createInvoice($fiatAmount: String!, $fiatCurrency: String!) {
    createInvoice(
      input: { fiatAmount: $fiatAmount, fiatCurrency: $fiatCurrency }
    ) {
      id
      invoiceNumber
      fiatAmount
      fiatCurrency
      store {
        name
        walletAddress
      }
    }
  }
`;

const updateInvoiceMutation = gql`
  mutation updateInvoice(
    $id: ID!
    $status: InvoiceStatus!
    $txHash: String!
    $assetUsed: AssetUsedType
    $cryptoAmount: Float
  ) {
    updateInvoice(
      id: $id
      input: {
        status: $status
        txHash: $txHash
        assetUsed: $assetUsed
        cryptoAmount: $cryptoAmount
      }
    ) {
      id
      status
    }
  }
`;

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isMobile: checkWindowSize(),
      activeTab: 'numberPad',
      totalAmount: '0',
      paymentModalOpen: false,
      setupModalOpen: false,
      pos: { address: null },
      invoiceId: null
    };
  }

  componentDidMount() {
    const { match } = this.props;

    // on screen resize
    checkWindowSize(false, isMobile => {
      this.setState({ isMobile });
    });

    this.onOpenModal = this.onOpenModal.bind(this);

    // if address is set
    if (match.params.id) {
      apolloClient.mutate({
        updateWalletMutation,
        variables: { address: match.params.id, source: 'getQuery' }
      });
    }

    this.querySubscription = apolloClient
      .watchQuery({ query })
      .subscribe(result => {
        if (result.data) {
          const objUpdate = {};
          if (!isNull(result.data.walletAddress)) {
            objUpdate.pos = { address: result.data.walletAddress };
          }
          this.setState({
            ...objUpdate,
            isLoggedIn: result.data.isLoggedIn
          });
        }
      });
  }

  componentWillUnmount() {
    this.querySubscription.unsubscribe();
  }

  onOpenModal(invoice) {
    this.setState({
      invoiceId: invoice.id,
      totalAmount: invoice.fiatAmount.toString(),
      paymentModalOpen: true
    });
  }

  handlePay = async () => {
    const { totalAmount } = this.state;

    const response = await apolloClient.query({ query });

    // add entry to API
    const invoiceResult = await apolloClient.mutate({
      mutation: createInvoiceMutation,
      variables: {
        fiatAmount: totalAmount.toString(),
        fiatCurrency: response.data.currency
      }
    });
    this.setState({
      invoiceId: invoiceResult.data.createInvoice.id,
      paymentModalOpen: true
    });
  };

  onClosePaymentModal = () => {
    this.setState({
      paymentModalOpen: false,
      totalAmount: '0'
    });
  };

  onPaymentReceived = data => {
    const { invoiceId } = this.state;

    setTimeout(() => {
      // close modal
      this.onClosePaymentModal();

      // reset state
      this.setState({
        totalAmount: '0'
      });
      if (this.productItems) {
        this.productItems.resetItems();
      }

      // send update to API
      apolloClient.mutate({
        mutation: updateInvoiceMutation,
        variables: { id: invoiceId, status: 'paid', ...data }
      });
    }, 5000);
  };

  handleNavItemChange = activeTab => {
    // eslint-disable-next-line
    const currentTab = this.state.activeTab;
    const nextTab = activeTab;
    if (
      (currentTab === 'productItems' && nextTab === 'numberPad') ||
      (currentTab === 'numberPad' && nextTab === 'productItems')
    ) {
      this.setState({ totalAmount: '0' });
    }
    this.setState({ activeTab });
  };

  render() {
    const { isMobile, totalAmount, paymentModalOpen, activeTab } = this.state;

    return (
      <Layout
        header={{ onNavItemClick: this.handleNavItemChange }}
        activeNavItem={activeTab}
      >
        <Seo title="POS" description="POS System" />
        {isMobile
          ? MobileView.call(this, this.props, this.state)
          : DesktopView.call(this, this.props, this.state)}
        {paymentModalOpen ? (
          <Payment
            onPaymentReceived={this.onPaymentReceived}
            isModalOpen={paymentModalOpen}
            onCloseModal={this.onClosePaymentModal}
            total={totalAmount}
          />
        ) : null}
      </Layout>
    );
  }
}

export default withRouter(Dashboard);
