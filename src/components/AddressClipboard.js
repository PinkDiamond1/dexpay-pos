import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Clipboard from 'react-clipboard.js';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
`;
const ClipboardBtn = styled(Clipboard)`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 100%;
`;
const Input = styled.input`
  background-color: #000000;
  color: #ffffff;
  width: 100%;
`;

const AddressClipboard = ({ address }) => {
  return (
    <Container>
      <ClipboardBtn data-clipboard-text={address}>
        <Input
          className="input"
          type="text"
          value={address}
          onChange={() => {}}
        />
      </ClipboardBtn>
    </Container>
  );
};

AddressClipboard.propTypes = {
  address: PropTypes.string.isRequired
};

export default AddressClipboard;
