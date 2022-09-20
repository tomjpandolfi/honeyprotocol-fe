import React, { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { InfoBlock } from '../InfoBlock/InfoBlock';
import { InputsBlock } from '../InputsBlock/InputsBlock';
import { Range } from '../Range/Range';
import * as styles from './BorrowForm.css';
import { formatNumber } from '../../helpers/format';
import honeyEyes from '/public/nfts/honeyEyes.png';
import HoneyButton from 'components/HoneyButton/HoneyButton';
import HexaBoxContainer from 'components/HexaBoxContainer/HexaBoxContainer';
import NftList from '../NftList/NftList';
import { NftCardProps } from '../NftCard/types';
import { MAX_LTV } from '../../constants/loan';
import { usdcAmount } from '../HoneyButton/HoneyButton.css';
import {BorrowProps} from './types';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { toastResponse } from 'helpers/loanHelpers';

const { format: f, formatPercent: fp, formatUsd: fu } = formatNumber;

const BorrowForm = (props: BorrowProps) => {
  const {availableNFTs, openPositions, nftPrice, executeDepositNFT, executeBorrow} = props;
  
  const [valueUSD, setValueUSD] = useState<number>();
  const [valueUSDC, setValueUSDC] = useState<number>();
  const [rangeValue, setRangeValue] = useState(0);
  const [isNftSelected, setIsNftSelected] = useState(false)
  const [selectedNft, setSelectedNft] = useState({name: '', id: '', img: '', mint: ''});
  const [hasOpenPosition, setHasOpenPosition] = useState(false);

  // Only for test purposes
  // const isNftSelected = true;

  // Put your validators here
  const isBorrowButtonDisabled = () => {
    return true;
  };
  // set selection state and render (or not) detail nft 
  const selectNFT = (name: string, id: string, img: string, mint?: any) => {
    if (hasOpenPosition == false) {
      setSelectedNft({ name, id, img, mint });
    } else {
      setIsNftSelected(true);
      setSelectedNft({ name, id, img, mint });
    }
  };

  // if user has an open position, we need to be able to click on the position and borrow against it
  useEffect(() => {
    if (openPositions?.length) setHasOpenPosition(true);
  }, openPositions);

  function handleDepositNFT() {
    if (selectedNft.mint.length < 1) return toastResponse('ERROR', 'Please select an NFT', 'ERROR');
    executeDepositNFT(selectedNft.mint)
  }

  const renderContent = () => {
    if (isNftSelected == false) {
      if (hasOpenPosition) {
        return (
          <>
            <div className={styles.newBorrowingTitle}>Collateralised position</div>
            <NftList 
              data={openPositions} 
              selectNFT={selectNFT}
              nftPrice={nftPrice}
            />
          </>
        );
      } else {
        return (
          <>
            <div className={styles.newBorrowingTitle}>Choose NFT</div>
            <NftList 
              data={availableNFTs} 
              selectNFT={selectNFT}
              nftPrice={nftPrice}
            />
          </>
        );
      }
    }

    return (
      <>
        <div className={styles.nftInfo}>
          <div className={styles.nftImage}>
            <HexaBoxContainer>
              <Image 
                src={selectedNft.img} 
                alt={`${selectedNft.name}`} 
                layout='fill'
              />
            </HexaBoxContainer>
          </div>
          <div className={styles.nftName}>{selectedNft.name}</div>
        </div>
        <div className={styles.row}>
          <div className={styles.col}>
            <InfoBlock
              value={fu(1000)}
              valueSize="big"
              footer={<span>Estimated value</span>}
            />
          </div>
          <div className={styles.col}>
            <InfoBlock
              value={fp(75)}
              valueSize="big"
              footer={<span>Liquidation at</span>}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <InfoBlock title={'Risk level'} value={fu(0)} />
          </div>
          <div className={styles.col}>
            <InfoBlock
              title={'New risk level'}
              value={fu(0)}
              isDisabled={true}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <InfoBlock title={'Debt'} value={fu(0)} />
          </div>
          <div className={styles.col}>
            <InfoBlock title={'New debt'} value={fu(0)} isDisabled={true} />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <InfoBlock
              title={'Allowance'}
              value={fu(600)}
              footer={<>No more than {fp(60)}</>}
            />
          </div>
          <div className={styles.col}>
            <InfoBlock title={'New allowance'} value={fu(0)} />
          </div>
        </div>

        <div className={styles.inputs}>
          <InputsBlock
            valueUSD={valueUSD}
            valueUSDC={valueUSDC}
            onChangeUSD={setValueUSD}
            onChangeUSDC={setValueUSDC}
          />
        </div>

        <Range
          currentValue={rangeValue}
          maxValue={1000}
          borrowedValue={0}
          maxSafePosition={0.4}
          maxAvailablePosition={MAX_LTV}
          onChange={setRangeValue}
        />
      </>
    );
  };

  const renderFooter = () => {
      if (hasOpenPosition) {
        return (
          <div className={styles.buttons}>
            <div className={styles.smallCol}>
              <HoneyButton variant="secondary" onClick={() => setIsNftSelected(false)}>Cancel</HoneyButton>
            </div>
            <div className={styles.bigCol}>
              <HoneyButton
                usdcAmount={valueUSDC || 0}
                usdcValue={valueUSD || 0}
                variant="primary"
                disabled={isBorrowButtonDisabled()}
                isFluid
              >
                Borrow
              </HoneyButton>
            </div>
          </div>
        );
      } else {
        return (
          <div className={styles.buttons}>
            <div className={styles.smallCol}>
              <HoneyButton
                variant="secondary"
                disabled={isBorrowButtonDisabled()}
                isFluid
              >
                Cancel
              </HoneyButton>
            </div>
            <div className={styles.bigCol}>
            <HoneyButton
              variant="primary"
              isFluid
              onClick={handleDepositNFT}
            >
              Deposit NFT
            </HoneyButton>
          </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.borrowForm}>
      <div className={styles.content}>{renderContent()}</div>

      <div className={styles.footer}>{renderFooter()}</div>
    </div>
  );
};

export default BorrowForm;
