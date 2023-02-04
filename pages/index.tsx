import type { NextPage } from 'next';
import { ConnectWallet } from '../layouts/connectWallet';

const Home: NextPage = () => {
  return (
    <>
      <ConnectWallet />
    </>
  );
};

export default Home;
