import type { NextPage } from 'next';
import React, { useEffect, useMemo, useState } from 'react';
import LayoutRedesign from '../../../components/LayoutRedesign/LayoutRedesign';
import HoneyContent from '../../../components/HoneyContent/HoneyContent';
import HoneySider from '../../../components/HoneySider/HoneySider';
import LendingSidebar from '../../../components/LendingSidebar/LendingSidebar';
import { Spin, Typography } from 'antd';
import { pageDescription, pageTitle } from 'styles/common.css';
import { LendFormProps } from '../../../components/LendForm/types';
import { FiltersSidebar } from '../../../components/FiltersSidebar/FiltersSidebar';
import { CategoryCards } from '../../../components/CategoryCards/CategoryCards';
import {
  P2PPosition,
  P2PCollection,
  PageMode,
  P2PLoans,
  P2PLoan
} from '../../../types/p2p';
import { P2PPageTitle } from '../../../components/P2PPagesTitle/P2PPageTitle';
import { CollectionsCards } from '../../../components/CollectionsCards/CollectionsCards';
import { P2PLendingMainList } from 'components/P2PLendingMainList/P2PLendingMainList';
import { DefaultOptionType } from 'rc-select/es/Select';
import { FeaturedCategory } from '../../../components/FeaturedCategories/types';
import { FeaturedCategories } from '../../../components/FeaturedCategories/FeaturedCategories';
import { getProgram } from 'helpers/p2p/getProgram';
import { Connection, Keypair } from '@solana/web3.js';
import c from 'classnames';
import {
  ConnectedWallet,
  useConnectedWallet,
  useConnection
} from '@saberhq/use-solana';
import {
  convertLoanResultToLoanObj,
  getDiscoverScreenLoanOrders
} from 'helpers/p2p/filterLoans';
import { FEATURED_COLLECTIONS } from 'constants/p2p';
import { spinner, pageLoadingSpinner } from 'styles/common.css';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';

const mockData = {
  name: 'Doodle #1290',
  imageUrl: '/images/mock-collection-image@2x.png',
  collectionName: 'Doodles'
};

const featuredCategoriesMock: FeaturedCategory[] = [
  {
    title: 'FLASHY',
    subtitle: 'NFT Finance collections',
    color: 'brownLight',
    icon: '/images/flashy-category-icon.svg'
  },
  {
    title: 'Blue Chips',
    subtitle: 'Degods, Monkey DAO, etc.',
    color: 'blue',
    icon: '/images/coin-category-icon.svg'
  },
  {
    title: 'Financial Products',
    subtitle: 'Options, LP Positions, etc.',
    color: 'green',
    icon: '/images/finance-category-icon.svg'
  }
];

const mockFilterParams = {
  maxTotalRequest: Math.floor(Math.random() * 1000),
  minTotalRequest: Math.floor(Math.random()),
  maxInterest: Math.floor(Math.random() * 10),
  minInterest: Math.floor(Math.random()),
  maxTotalSupplied: Math.floor(Math.random() * 1000),
  minTotalSupplied: Math.floor(Math.random())
};
const mockTags = [
  '#Art',
  '#Domains',
  '#Financial',
  '#Gaming',
  '#Music',
  '#PFP',
  '#Staking',
  '#Utility'
];
const rulesFilters: DefaultOptionType[] = [
  { label: 'Rule #1', value: 'rule_1', rule: 'mock rule#1' },
  { label: 'Rule #2', value: 'rule_2', rule: 'mock rule#2' },
  { label: 'Rule #3', value: 'rule_3', rule: 'mock rule#3' },
  { label: 'Rule #4', value: 'rule_4', rule: 'mock rule#4' },
  { label: 'Rule #5', value: 'rule_5', rule: 'mock rule#5' },
  { label: 'Rule #6', value: 'rule_6', rule: 'mock rule#6' }
];

export const getLoans = async (
  walletAddress: string,
  connection: Connection,
  wallet: ConnectedWallet | null
) => {
  const readOnlyKeypair = new Keypair();
  const readonlyWallet = new NodeWallet(readOnlyKeypair);
  const program = await getProgram(
    connection,
    (wallet as any) ?? readonlyWallet
  );
  let loansData = await program.account.loanMetadata.all();

  const loans: P2PLoans = loansData.map(loan =>
    convertLoanResultToLoanObj(loan)
  );

  const filtered = getDiscoverScreenLoanOrders(loans);
  return filtered;
};

const Lending: NextPage = () => {
  const wallet = useConnectedWallet();
  const connection = useConnection();
  const [isMobileSidebarVisible, setShowMobileSidebar] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>(PageMode.INITIAL_STATE);
  const [selectedCategory, setSelectedCategory] = useState<FeaturedCategory>();
  const [selectedCollection, setSelectedCollection] = useState<P2PCollection>();
  const [selectedLoan, setSelectedLoan] = useState<P2PLoan>();
  const [displayedLoans, setDisplayedLoans] = useState<P2PLoans>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState<boolean>(true);

  useEffect(() => {
    const getAppliedAndActiveLoans = async () => {
      try {
        setIsLoadingLoans(true);
        const loans = await getLoans(
          wallet?.publicKey.toString() ?? '',
          connection,
          wallet
        );
        setDisplayedLoans(loans ?? []);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoadingLoans(false);
      }
    };
    getAppliedAndActiveLoans();
  }, [wallet, connection]);

  const showMobileSidebar = () => {
    setShowMobileSidebar(true);
    document.body.classList.add('disable-scroll');
  };

  const hideMobileSidebar = () => {
    setShowMobileSidebar(false);
    document.body.classList.remove('disable-scroll');
  };

  const handleSelectCategory = (title: string) => {
    const foundCategory = featuredCategoriesMock.find(
      item => item.title === title
    );
    if (foundCategory) {
      setPageMode(PageMode.CATEGORY_SELECTED);
      setSelectedCategory(foundCategory);
    }
  };

  const handleCollectionSelect = (id: string) => {
    const collection = FEATURED_COLLECTIONS.find(
      collection => collection.id === id
    );
    setSelectedCollection(collection);
    setPageMode(PageMode.COLLECTION_SELECTED);
  };

  const lendingSidebar = () => {
    switch (pageMode) {
      case PageMode.INITIAL_STATE:
        return (
          <HoneySider isMobileSidebarVisible={isMobileSidebarVisible}>
            <FiltersSidebar
              tags={mockTags}
              rules={rulesFilters}
              initParams={mockFilterParams}
            />
          </HoneySider>
        );
      case PageMode.CATEGORY_SELECTED:
        return (
          <HoneySider isMobileSidebarVisible={isMobileSidebarVisible}>
            <FiltersSidebar
              tags={mockTags}
              rules={rulesFilters}
              initParams={mockFilterParams}
            />
          </HoneySider>
        );
      default:
        return (
          <HoneySider isMobileSidebarVisible={isMobileSidebarVisible}>
            <LendingSidebar
              collectionId="a"
              collectionName="collection name"
              loan={selectedLoan}
              onCancel={hideMobileSidebar}
            />
          </HoneySider>
        );
    }
  };

  console.log({ selectedCategory });

  const cards = (pageMode: PageMode) => {
    switch (pageMode) {
      case PageMode.INITIAL_STATE:
        return (
          <CategoryCards
            onSelect={handleCollectionSelect}
            selected={selectedCollection}
            data={FEATURED_COLLECTIONS}
          />
        );
      case PageMode.CATEGORY_SELECTED:
        return (
          <CollectionsCards
            onCollectionSelect={handleCollectionSelect}
            selectedCollectionId={selectedCollection?.id}
            data={FEATURED_COLLECTIONS}
          />
        );
      case PageMode.COLLECTION_SELECTED:
        return isLoadingLoans ? (
          <div className={c(spinner, pageLoadingSpinner)}>
            <Spin size="large" />
          </div>
        ) : (
          <P2PLendingMainList
            data={displayedLoans}
            selected={selectedLoan}
            onSelect={loan => setSelectedLoan(loan)}
          />
        );
    }
  };

  const title = (pageMode: PageMode) => {
    switch (pageMode) {
      case PageMode.INITIAL_STATE:
        return (
          <>
            <Typography.Title className={pageTitle}>
              P2P Lending
            </Typography.Title>
            <Typography.Text className={pageDescription}>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has
            </Typography.Text>
            <FeaturedCategories
              data={featuredCategoriesMock}
              onClick={handleSelectCategory}
            />
          </>
        );
      case PageMode.CATEGORY_SELECTED:
        return (
          <P2PPageTitle
            onGetBack={() => setPageMode(PageMode.INITIAL_STATE)}
            name={selectedCategory?.title ?? ''}
            img={selectedCategory?.icon}
          />
        );
      case PageMode.COLLECTION_SELECTED:
        return (
          <P2PPageTitle
            onGetBack={() => setPageMode(PageMode.INITIAL_STATE)}
            name={selectedCollection?.name ?? ''}
            img={selectedCollection?.imageUrl}
          />
        );
    }
  };

  return (
    <LayoutRedesign>
      <HoneyContent>{title(pageMode)}</HoneyContent>
      <HoneyContent sidebar={lendingSidebar()}>{cards(pageMode)}</HoneyContent>
    </LayoutRedesign>
  );
};

export default Lending;
