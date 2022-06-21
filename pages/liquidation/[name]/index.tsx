import type { NextPage } from 'next';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Box, Stack, Button, IconChevronLeft, Text, Avatar } from 'degen';
import Layout from '../../../components/Layout/Layout';
import * as styles from '../../../styles/liquidation.css';

interface LiquidationDetailProps {
  loan: any;
}

const LiquidationDetail: NextPage<LiquidationDetailProps> = (props: LiquidationDetailProps) => {
  const {loan} = props;
  console.log('this is the loan', loan)

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
      </Stack>
      <Box className={styles.liquidationDetaiPageWrapper}>
        <Box className={styles.liquidationDetaiPageWrapperImage}>
          <Avatar
            label="Image of NFT" 
            src={'https://assets.coingecko.com/coins/images/24781/small/honey.png?1648902423'}
          />
        </Box>
        <Box>
          <Box>
            <Text size="headingOne" color="accent">Liquidation 443</Text>
            <Box>
              <Stack>
                <Box>
                  <Text size="headingTwo">
                    Time left for auction
                  </Text>
                  <Text>
                    0h 0m 0s
                  </Text>
                </Box>
                <Box>
                  <Text size="headingTwo">
                    Price of winning bid
                  </Text>
                  <Text>
                    100 SOL
                  </Text>
                </Box>
                <Box>
                  <Text size="headingTwo">Address of new owner:</Text>
                  <Text>Xaheh12...</Text>
                </Box>
                <Box>
                  <Text size="headingTwo">Date of creation</Text>
                  <Text>22-02-2022</Text>
                </Box>
              </Stack>
            </Box>
            <Box className={styles.buttonWrapper}>
              <Button variant="primary">View on Etherscan</Button>
              <Button variant="primary">Bidding History</Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default LiquidationDetail;
