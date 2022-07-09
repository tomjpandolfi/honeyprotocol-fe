import type { NextPage } from 'next';
import Image from 'next/image'
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Box, Stack, Button, IconChevronLeft, IconClose, Text, Avatar, IconWallet, IconChevronDown, IconChevronRight } from 'degen';
import Layout from '../../../components/Layout/Layout';
import * as styles from '../../../styles/liquidation.css';
import { useConnectedWallet } from '@saberhq/use-solana';
import LiquidationHeader from 'components/LiquidationHeader/LiquidationHeader';
import LiquidationCard from 'components/LiquidationCard/LiquidationCard';
import { useAnchor, LiquidatorClient } from '@honey-finance/sdk';
import { HONEY_PROGRAM_ID, HONEY_MARKET_ID } from '../../../constants/loan';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import LiquidationBiddingModal from 'components/LiquidationBiddingModal/LiquidationBiddingModal';

const LiquidationPool = () => {
  // init anchor
  const { program } = useAnchor();
  // create wallet instance for PK
  const wallet = useConnectedWallet();
  const [currentObligations, setCurrentObligations] = useState();

  const headerData = ['Position', 'Debt', 'Address', 'LTV %', 'Health Factor', 'Highest Bid'];
  const dataSet = [
    {
      position: '(...)',
      debt: '63',
      address: 'xAz2Li..',
      lvt: '62',
      healthFactor: 'Healthy',
      highestBid: '288'
    },
    {
      position: '(...)',
      debt: '122',
      address: 'xAz2Li..',
      lvt: '62',
      healthFactor: 'Healthy',
      highestBid: '321'
    },
    {
      position: '(...)',
      debt: '319',
      address: 'xAz2Li..',
      lvt: '62',
      healthFactor: 'Healthy',
      highestBid: '682'
    },
    {
      position: '(...)',
      debt: '122',
      address: 'xAz2Li..',
      lvt: '62',
      healthFactor: 'Healthy',
      highestBid: '321'
    },
    {
      position: '(...)',
      debt: '319',
      address: 'xAz2Li..',
      lvt: '62',
      healthFactor: 'Healthy',
      highestBid: '682'
    },
  ];

  const [showBiddingModal, setBiddingModal] = useState(false);

  useEffect(() => {
    async function fetchObligations() {
      console.log('fetching obligations...');
      let obligations = await program?.account?.obligation?.all();
      if (obligations) {
        console.log('obligations', obligations);

        obligations.map(item => {
          console.log('this is each obligation', item);
          let owner = item.account.owner.toString();
          // console.log('owner', owner);
          let nftMints:PublicKey[] = item.account.collateralNftMint;
          nftMints.map((nft) => {
            // console.log('this is the nft', nft)
            if(nft.toString() != '11111111111111111111111111111111') {
              console.log('nftCollateral', nft.toString());
            }
          })
        })
      }
    }

    fetchObligations();
}, [program]);
  
  function handleShowBiddingModal() {
    showBiddingModal == false ? setBiddingModal(true) : setBiddingModal(false);
  }

  useEffect(() => {}, [showBiddingModal]);

  async function fetchLiquidatorClient(type: string, userBid: number) {
    try {
      const liquidatorClient = await LiquidatorClient.connect(program.provider, HONEY_PROGRAM_ID, false);
      if (wallet) {
        if (type == 'revoke_bid') {
          await liquidatorClient.revokeBid({
           market: new PublicKey(HONEY_MARKET_ID),
           bidder: wallet.publicKey,
           bid_mint: 'E6zFcM22QzSy1aUc8MrJQ4MuHQsevGid2yYPo3heujJF',
           withdraw_destination: wallet.publicKey  
          })
        } else if (type == 'place_bid') {
            await liquidatorClient.placeBid({
              bid_limit: userBid,
              market: new PublicKey(HONEY_MARKET_ID),
              bidder: wallet.publicKey,
              bid_mint: 'E6zFcM22QzSy1aUc8MrJQ4MuHQsevGid2yYPo3heujJF'
            })
        } else if (type == 'increase_bid') {
            await liquidatorClient.revokeBid({
              bid_increase: userBid,
              market: new PublicKey(HONEY_MARKET_ID),
              bidder: wallet.publicKey,
              bid_mint: 'E6zFcM22QzSy1aUc8MrJQ4MuHQsevGid2yYPo3heujJF'
            })
          }
      } else {
          return;
      }
      } catch (error) {
          return console.log('error:', error);
      }
  }

  /**
   * @params
   * @description
   * @returns
  */
  // interface PlaceBidParams {
  //   bid_limit: number;
  //   market: PublicKey;
  //   bidder: PublicKey;
  //   bid_mint: PublicKey;
  //   deposit_source?: PublicKey;
  // }

  // interface IncreaseBidParams {
  //   bid_increase: number;
  //   market: PublicKey;
  //   bidder: PublicKey;
  //   bid_mint: PublicKey;
  //   deposit_source?: PublicKey;
  // }

  // interface RevokeBidParams {
  //   market: PublicKey;
  //   bidder: PublicKey;
  //   bid_mint: PublicKey;
  //   withdraw_destination?: PublicKey;
  // }

  /**
   * @params
   * @description
   * @returns
  */
  // function handleIncreaseBid(userBid: number, params: IncreaseBidParams) {
  //   fetchLiquidatorClient('increase_bid', {
  //     bid_increase: userBid,
  //     market: PublicKey,
  //     bidder: PublicKey,
  //     bid_mint: PublicKey,
  //     deposit_source: PublicKey,
  //   })
  // }

  /**
   * @params
   * @description
   * @returns
  */
  // function handleRevokeBid(params: RevokeBidParams) {
  //   fetchLiquidatorClient('revoke_bid', {
  //     market: PublicKey,
  //     bidder: PublicKey,
  //     bid_mint: PublicKey,
  //     withdraw_destination: PublicKey
  //   });
  // }

  /**
   * @params
   * @description
   * @returns
  */
  // function handlePlaceBid(userBid: number, params: PlaceBidParams) {
  //   fetchLiquidatorClient('place_bid', {
  //     bid_limit: userBid,
  //     market: PublicKey,
  //     bidder: PublicKey,
  //     bid_mint: PublicKey,
  //     deposit_source: PublicKey
  //   })
  // }


  // function validatePositions() {
  //   openPositions 
  //   ? 
  //   toastResponse('LIQUIDATION', '1 oustanding bid', 'LIQUIDATION')
  //   :
  //   toastResponse('LIQUIDATION', 'No outstanding bid', 'LIQUIDATION')
  // }

  // validatePositions();
  async function handleExecuteBid(userBid: any) {
    await fetchLiquidatorClient('place_bid', userBid)
  }

  return (
    <Layout>
      <Stack>
        <Box>
          <Stack
            direction="horizontal"
            justify="space-between"
            wrap
            align="center"
          >
            <Box display="flex" alignSelf="center" justifySelf="center">
              <Link href="/liquidation" passHref>
                <Button
                  size="small"
                  variant="transparent"
                  rel="noreferrer"
                  prefix={<IconChevronLeft />}
                >
                  Liquidations
                </Button>
              </Link>
            </Box>
          </Stack>
        </Box>
        <LiquidationHeader 
            headerData={headerData}
          />
        <Box>
          {
            dataSet.map((loan, i) => (
              <LiquidationCard 
                key={i}
                loan={loan}
                liquidationType={true}
                handleShowBiddingModal={handleShowBiddingModal}
                handleExecuteBid={() => handleExecuteBid}
              />
            ))
          }
        </Box>
        <Box>
          {
            showBiddingModal && (
              <LiquidationBiddingModal 
                handleShowBiddingModal={handleShowBiddingModal}
                handleExecuteBid={handleExecuteBid}
              />
            )
          }
        </Box>
      </Stack>
    </Layout>
  );
};

export default LiquidationPool;