import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { InfoBlock } from '../InfoBlock/InfoBlock';
import { InputsBlock } from '../InputsBlock/InputsBlock';
import { HoneySlider } from '../HoneySlider/HoneySlider';
import * as styles from './RepayForm.css';
import { formatNumber } from '../../helpers/format';
import honeyEyes from '/public/nfts/honeyEyes.png';
import HoneyButton from 'components/HoneyButton/HoneyButton';
import HexaBoxContainer from '../HexaBoxContainer/HexaBoxContainer';
import { RepayProps } from './types';
import SidebarScroll from '../SidebarScroll/SidebarScroll';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { isNil } from '../../helpers/utils';
import { hAlign } from 'styles/common.css';
import { questionIcon } from 'styles/icons.css';
import cs from 'classnames';
import useToast from 'hooks/useToast';

const { format: f, formatPercent: fp, formatUsd: fu, parse: p } = formatNumber;

const RepayForm = (props: RepayProps) => {
  const {
    executeRepay,
    openPositions,
    nftPrice,
    executeWithdrawNFT,
    userAllowance,
    userDebt,
    userUSDCBalance,
    loanToValue
  } = props;

  const [valueUSD, setValueUSD] = useState<number>();
  const [valueUSDC, setValueUSDC] = useState<number>();
  const [sliderValue, setSliderValue] = useState(0);
  const { toast, ToastComponent } = useToast();

  const maxValue = userDebt != 0 ? userDebt : userAllowance;
  const usdcPrice = 0.95;

  // Put your validators here
  const isRepayButtonDisabled = () => {
    return false;
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    setValueUSD(value / usdcPrice);
    setValueUSDC(value);
  };

  const handleUsdInputChange = (usdValue: number | undefined) => {
    if (!usdValue) {
      setValueUSD(0);
      setValueUSDC(0);
      setSliderValue(0);
      return;
    }
    setValueUSD(usdValue);
    setValueUSDC(usdValue / usdcPrice);
    setSliderValue(usdValue);
  };

  const handleUsdcInputChange = (usdcValue: number | undefined) => {
    if (!usdcValue) {
      setValueUSD(0);
      setValueUSDC(0);
      setSliderValue(0);
      return;
    }

    setValueUSD(usdcValue * usdcPrice);
    setValueUSDC(usdcValue);
    setSliderValue(usdcValue * usdcPrice);
  };

  const onRepay = async (event: any) => {
    const btnText = event.target.innerHTML;
    const mintId = new PublicKey(openPositions[0].mint).toString();
    console.log('this is mintId', mintId);
    // repay function here
    if (btnText == 'Claim NFT') {
      console.log('mint id', mintId);
      executeWithdrawNFT(mintId, toast);
    } else {
      executeRepay(valueUSDC || 0, toast);
    }
  };

  useEffect(() => {}, [
    openPositions,
    userDebt,
    userAllowance,
    nftPrice,
    loanToValue,
    userUSDCBalance
  ]);

  return (
    <SidebarScroll
      footer={
        <>
          {toast?.state ? (
            ToastComponent
          ) : (
            <div className={styles.buttons}>
              <div className={styles.smallCol}>
                <HoneyButton variant="secondary">Cancel</HoneyButton>
              </div>
              <div className={styles.bigCol}>
                <HoneyButton
                  variant="primary"
                  usdcAmount={valueUSDC || 0}
                  usdcValue={valueUSD || 0}
                  disabled={isRepayButtonDisabled()}
                  isFluid={true}
                  onClick={onRepay}
                >
                  {userDebt > 0 ? 'Repay' : 'Claim NFT'}
                </HoneyButton>
              </div>
            </div>
          )}
        </>
      }
    >
      <div className={styles.repayForm}>
        <div className={styles.nftInfo}>
          <div className={styles.nftImage}>
            <HexaBoxContainer>
              <Image src={honeyEyes} layout="fill" />
            </HexaBoxContainer>
          </div>
          <div className={styles.nftName}>{openPositions[0].name}</div>
        </div>
        <div className={styles.row}>
          <div className={styles.col}>
            <InfoBlock
              value={fu(nftPrice)}
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
            <InfoBlock title={'Risk level'} value={fp(loanToValue * 100)} />
            <InfoBlock
              value={fu(loanToValue)}
              toolTipLabel={
                <span>
                  Risk level is measured using the{' '}
                  <a
                    className={styles.extLink}
                    target="blank"
                    href="https://docs.honey.finance/learn/defi-lending#loan-to-value-ratio"
                  >
                    loan-to-value ratio
                  </a>
                  , and determines how close a position is to being liquidated.
                </span>
              }
              title={
                <span className={hAlign}>
                  Risk level <div className={questionIcon} />
                </span>
              }
            />
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
            <InfoBlock title={'Debt'} value={fu(userDebt)} />
          </div>
          <div className={styles.col}>
            <InfoBlock title={'New debt'} value={fu(0)} isDisabled={true} />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <InfoBlock
              value={fu(userAllowance)}
              title={
                <span className={hAlign}>
                  Allowance <div className={questionIcon} />
                </span>
              }
              footer={<span>No more than {fp(60)}</span>}
              toolTipLabel="Allowance determines how much debt is available to a borrower."
            />
          </div>
          <div className={styles.col}>
            <InfoBlock title={'New allowance'} value={fu(0)} />
          </div>
        </div>

        <div className={styles.inputs}>
          <div className={styles.balance}>
            <InfoBlock
              title={'Your USDC balance'}
              value={f(8120.19)}
            ></InfoBlock>
          </div>

          <InputsBlock
            valueUSD={p(f(valueUSD))}
            valueUSDC={p(f(valueUSDC))}
            onChangeUSD={handleUsdInputChange}
            onChangeUSDC={handleUsdcInputChange}
          />
        </div>

        <HoneySlider
          currentValue={sliderValue}
          maxValue={maxValue}
          minAvailableValue={0}
          onChange={handleSliderChange}
        />
      </div>
    </SidebarScroll>
  );
};

export default RepayForm;
