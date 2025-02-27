import type { NextPage } from 'next';
import LayoutRedesign from '../../components/LayoutRedesign/LayoutRedesign';
import MarketsSidebar from '../../components/MarketsSidebar/MarketsSidebar';
import HoneyTable from '../../components/HoneyTable/HoneyTable';
import { ColumnType } from 'antd/lib/table';
import * as style from '../../styles/markets.css';
import c from 'classnames';
import classNames from 'classnames';
import BN from 'bn.js';
import {
  BorrowSidebarMode,
  HoneyTableColumnType,
  MarketTablePosition,
  MarketTableRow
} from '../../types/markets';
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { formatNFTName, formatNumber } from '../../helpers/format';
import Image from 'next/image';
import { ColumnTitleProps, Key } from 'antd/lib/table/interface';
import debounce from 'lodash/debounce';
import SearchInput from '../../components/SearchInput/SearchInput';
import HexaBoxContainer from 'components/HexaBoxContainer/HexaBoxContainer';
import { InfoBlock } from 'components/InfoBlock/InfoBlock';
import HoneyButton from '../../components/HoneyButton/HoneyButton';
import EmptyStateDetails from 'components/EmptyStateDetails/EmptyStateDetails';
import { getColumnSortStatus } from '../../helpers/tableUtils';
import { useConnectedWallet, useSolana } from '@saberhq/use-solana';
import { BnToDecimal, ConfigureSDK } from '../../helpers/loanHelpers/index';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import HealthLvl from '../../components/HealthLvl/HealthLvl';
import useFetchNFTByUser from 'hooks/useNFTV2';
import {
  borrowAndRefresh,
  depositNFT,
  repayAndRefresh,
  useBorrowPositions,
  useHoney,
  useMarket,
  fetchAllMarkets,
  MarketBundle,
  waitForConfirmation,
  withdrawNFT
} from '@honey-finance/sdk';
import {
  calcNFT,
  fetchSolPrice,
  getInterestRate,
  populateMarketData,
  calculateMarketDebt,
  calculateUserDeposits,
  fetchAllowance,
  fetchUserDebt,
  fetchLTV,
  decodeReserve
} from 'helpers/loanHelpers/userCollection';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { ToastProps } from 'hooks/useToast';
import { RoundHalfDown } from 'helpers/utils';
import HoneyContent from '../../components/HoneyContent/HoneyContent';
import HoneySider from '../../components/HoneySider/HoneySider';
import { TABLET_BP } from '../../constants/breakpoints';
import useWindowSize from '../../hooks/useWindowSize';
import { Space, Typography } from 'antd';
import { pageDescription, pageTitle } from 'styles/common.css';
import HoneyTableRow from 'components/HoneyTable/HoneyTableRow/HoneyTableRow';
import HoneyTableNameCell from '../../components/HoneyTable/HoneyTableNameCell/HoneyTableNameCell';
import {
  marketCollections,
  OpenPositions
} from '../../helpers/marketHelpers/index';
import HoneyTooltip from '../../components/HoneyTooltip/HoneyTooltip';
import {
  handleOpenPositions,
  renderMarketName,
  renderMarketImageByID
} from '../../helpers/marketHelpers';
import {
  renderMarket,
  renderMarketImageByName,
  HONEY_GENESIS_MARKET_ID,
  COLLATERAL_FACTOR
} from 'helpers/marketHelpers';
/**
 * @description formatting functions to format with perfect / format in SOL with icon or just a regular 2 decimal format
 * @params value to be formatted
 * @returns requested format
 */
import CreateMarketSidebar from '../../components/CreateMarketSidebar/CreateMarketSidebar';
// TODO: change to dynamic value
const network = 'mainnet-beta';
import { featureFlags } from 'helpers/featureFlags';
import SorterIcon from 'icons/Sorter';
import ExpandedRowIcon from 'icons/ExpandedRowIcon';
import useToast from 'hooks/useToast';
import { toast } from 'components/HoneyToast/HoneyToast.css';
import HoneyToggle from 'components/HoneyToggle/HoneyToggle';
// import { network } from 'pages/_app';
const { format: f, formatPercent: fp, formatSol: fs } = formatNumber;

const Markets: NextPage = () => {
  const { toast, ToastComponent } = useToast();
  // Sets market ID which is used for fetching market specific data
  // each market currently is a different call and re-renders the page
  const [currentMarketId, setCurrentMarketId] = useState(
    HONEY_GENESIS_MARKET_ID
  );
  // init wallet and sdkConfiguration file
  const wallet = useConnectedWallet() || null;
  const sdkConfig = ConfigureSDK();
  const { disconnect } = useSolana();
  const [sidebarMode, setSidebarMode] = useState<BorrowSidebarMode>(
    BorrowSidebarMode.MARKET
  );
  /**
   * @description sets the market ID based on market click
   * @params Honey table record - contains all info about a table (aka market / collection)
   * @returns sets the market ID which re-renders page state and fetches market specific data
   */
  async function handleMarketId(record: any) {
    setCurrentMarketId(record.id);
  }
  /**
   * @description fetches market reserve info | parsed reserves | fetch market (func) from SDK
   * @params none
   * @returns market | market reserve information | parsed reserves |
   */
  const { marketReserveInfo, parsedReserves, fetchMarket } = useHoney();
  /**
   * @description fetches honey client | honey user | honey reserves | honey market from SDK
   * @params  useConnection func. | useConnectedWallet func. | honeyID | marketID
   * @returns honeyUser | honeyReserves - used for interaction regarding the SDK
   */
  const { honeyClient, honeyUser, honeyReserves, honeyMarket } = useMarket(
    sdkConfig.saberHqConnection,
    sdkConfig.sdkWallet,
    sdkConfig.honeyId,
    currentMarketId
  );
  /**
   * @description fetches collateral nft positions | refresh positions (func) from SDK
   * @params useConnection func. | useConnectedWallet func. | honeyID | marketID
   * @returns collateralNFTPositions | loanPositions | loading | error
   */
  let {
    loading,
    collateralNFTPositions,
    loanPositions,
    refreshPositions,
    error
  } = useBorrowPositions(
    sdkConfig.saberHqConnection,
    sdkConfig.sdkWallet!,
    sdkConfig.honeyId,
    currentMarketId
  );

  // market specific constants - calculations / ratios / debt / allowance etc.
  const [nftPrice, setNftPrice] = useState(0);
  const [userOpenPositions, setUserOpenPositions] = useState<
    Array<OpenPositions>
  >([]);
  const [userAllowance, setUserAllowance] = useState(0);
  const [loanToValue, setLoanToValue] = useState(0);
  const [userDebt, setUserDebt] = useState(0);
  const [cRatio, setCRatio] = useState(0);
  const [reserveHoneyState, setReserveHoneyState] = useState(0);
  const [launchAreaWidth, setLaunchAreaWidth] = useState<number>(840);
  const [fetchedSolPrice, setFetchedSolPrice] = useState(0);
  const [activeInterestRate, setActiveInterestRate] = useState(0);
  // interface related constants
  const { width: windowWidth } = useWindowSize();
  const [tableData, setTableData] = useState<MarketTableRow[]>([]);
  const [fetchedDataObject, setFetchedDataObject] = useState<MarketBundle>();
  const [tableDataFiltered, setTableDataFiltered] = useState<MarketTableRow[]>(
    []
  );
  const [expandedRowKeys, setExpandedRowKeys] = useState<readonly Key[]>([]);
  const [isMyCollectionsFilterEnabled, setIsMyCollectionsFilterEnabled] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarVisible, setShowMobileSidebar] = useState(false);
  const [showWeeklyRates, setShowWeeklyRates] = useState(true);

  /**
   * @description fetches all nfts in users wallet
   * @params wallet
   * @returns array of:
   * [0] users nfts
   * [1] loading state
   * [2] reFetch function which can be called after deposit or withdraw and updates nft list
   */
  const [NFTs, isLoadingNfts, refetchNfts] = useFetchNFTByUser(wallet);

  const [isCreateMarketAreaOnHover, setIsCreateMarketAreaOnHover] =
    useState<boolean>(false);

  // fetches the sol price
  // TODO: create type for reserves and connection
  async function fetchSolValue(reserves: any, connection: any) {
    const slPrice = await fetchSolPrice(reserves, connection);
    setFetchedSolPrice(slPrice);
  }

  const [marketData, setMarketData] = useState<MarketBundle[]>([]);

  async function fetchAllMarketData(marketIDs: string[]) {
    const data = await fetchAllMarkets(
      sdkConfig.saberHqConnection,
      sdkConfig.sdkWallet,
      sdkConfig.honeyId,
      marketIDs,
      false
    );

    setMarketData(data as unknown as MarketBundle[]);
  }

  useEffect(() => {
    if (
      sdkConfig.saberHqConnection &&
      sdkConfig.sdkWallet &&
      sdkConfig.honeyId
    ) {
      const marketIDs = marketCollections.map(market => market.id);
      fetchAllMarketData(marketIDs);
    }
  }, [sdkConfig.saberHqConnection, sdkConfig.sdkWallet]);

  /**
   * @description sets state of marketValue by parsing lamports outstanding debt amount to SOL
   * @params none, requires parsedReserves
   * @returns updates marketValue
   */
  useEffect(() => {
    if (parsedReserves && sdkConfig.saberHqConnection) {
      fetchSolValue(parsedReserves, sdkConfig.saberHqConnection);
    }
  }, [parsedReserves]);

  // sets cRatio, liquidationThreshold and calls fetchHelperValues
  useEffect(() => {
    if (marketReserveInfo && parsedReserves) {
      setCRatio(BnToDecimal(marketReserveInfo[0].minCollateralRatio, 15, 5));
    }
  }, [marketReserveInfo, parsedReserves]);

  // if there are open positions for the user -> set the open positions
  useEffect(() => {
    if (loading === false) {
      if (collateralNFTPositions) {
        setUserOpenPositions(collateralNFTPositions);
        // setHasNFTDeposited(true);
      } else if (!collateralNFTPositions) {
        setUserOpenPositions([]);
      }
    }
  }, [loading]);
  // function is setup to handle an array for all markets and return based on specific market by verified creator
  async function handlePositions(
    verifiedCreator: string,
    currentOpenPositions: any
  ) {
    return await handleOpenPositions(verifiedCreator, currentOpenPositions);
  }
  // calculation of health percentage
  const healthPercent =
    ((nftPrice - userDebt / COLLATERAL_FACTOR) / nftPrice) * 100;

  // inits the markets with relevant data
  useEffect(() => {
    if (sdkConfig.saberHqConnection) {
      function getData() {
        return Promise.all(
          marketCollections.map(async collection => {
            if (collection.id == '') return collection;

            if (marketData.length) {
              collection.marketData = marketData.filter(
                marketObject =>
                  marketObject.market.address.toString() === collection.id
              );
              const honeyUser = collection.marketData[0].user;
              const honeyMarket = collection.marketData[0].market;
              const honeyClient = collection.marketData[0].client;
              const parsedReserves = collection.marketData[0].reserves[0].data;

              await populateMarketData(
                'BORROW',
                collection,
                sdkConfig.saberHqConnection,
                sdkConfig.sdkWallet,
                currentMarketId,
                false,
                collection.marketData[0].positions,
                true,
                honeyClient,
                honeyMarket,
                honeyUser,
                parsedReserves
              );

              collection.openPositions = await handlePositions(
                collection.verifiedCreator,
                userOpenPositions
              );

              collection.rate =
                (await getInterestRate(
                  collection.utilizationRate,
                  collection.id
                )) || 0;

              if (currentMarketId === collection.id) {
                // @ts-ignore
                setNftPrice(RoundHalfDown(collection.nftPrice));
                setUserAllowance(collection.allowance);
                // @ts-ignore
                setUserDebt(collection.userDebt);
                setLoanToValue(Number(collection.ltv));
                setActiveInterestRate(collection.rate);
                setFetchedDataObject(collection.marketData[0]);
              }
              return collection;
            } else {
              await populateMarketData(
                'BORROW',
                collection,
                sdkConfig.saberHqConnection,
                sdkConfig.sdkWallet,
                currentMarketId,
                false,
                [],
                false
              );

              collection.openPositions = await handlePositions(
                collection.verifiedCreator,
                userOpenPositions
              );
              collection.rate =
                (await getInterestRate(
                  collection.utilizationRate,
                  collection.id
                )) || 0;

              if (currentMarketId === collection.id)
                setActiveInterestRate(collection.rate);
              return collection;
            }
          })
        );
      }

      getData().then(result => {
        setTableData(result);
        setTableDataFiltered(result);
      });
    }
  }, [
    currentMarketId,
    marketData,
    reserveHoneyState,
    userOpenPositions,
    NFTs,
    userOpenPositions
  ]);

  const showMobileSidebar = () => {
    setShowMobileSidebar(true);
    document.body.classList.add('disable-scroll');
  };

  const hideMobileSidebar = () => {
    setShowMobileSidebar(false);
    document.body.classList.remove('disable-scroll');
  };

  const handleToggle = (checked: boolean) => {
    setIsMyCollectionsFilterEnabled(checked);
  };

  const WeeklyToggle = () => (
    <div className={style.headerCell['disabled']}>
      <Space direction="horizontal">
        <HoneyToggle
          defaultChecked
          checked={showWeeklyRates}
          onChange={value => {
            setShowWeeklyRates(value);
          }}
          title="Weekly"
        />{' '}
        WEEKLY
      </Space>
    </div>
  );

  const onSearch = (searchTerm: string): MarketTableRow[] => {
    if (!searchTerm) {
      return [...tableData];
    }
    const r = new RegExp(searchTerm, 'mi');
    return [...tableData].filter(row => {
      return r.test(row.name);
    });
  };

  const debouncedSearch = useCallback(
    debounce(searchQuery => {
      setTableDataFiltered(onSearch(searchQuery));
    }, 500),
    [tableData]
  );

  const handleSearchInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      debouncedSearch(value);
    },
    [tableData]
  );

  // Apply search if initial markets list changed
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [tableData]);

  const SearchForm = () => {
    return (
      <SearchInput
        onChange={handleSearchInputChange}
        placeholder="Search by name"
        value={searchQuery}
      />
    );
  };
  const columnsWidth: Array<number | string> = [240, 150, 150, 150, 150];
  // Render func. for desktop
  // @ts-ignore
  const columns: HoneyTableColumnType<MarketTableRow>[] = useMemo(
    () =>
      [
        {
          width: columnsWidth[0],
          title: SearchForm,
          dataIndex: 'name',
          key: 'name',
          children: [
            {
              // title: '',
              dataIndex: 'name',
              width: columnsWidth[0],
              key: 'name',
              render: (name: string, data: MarketTableRow, index: number) => {
                return (
                  <div className={style.nameCell}>
                    <div className={style.logoWrapper}>
                      <div className={style.collectionLogo}>
                        <HexaBoxContainer>
                          {renderMarketImageByName(name)}
                        </HexaBoxContainer>
                      </div>
                    </div>
                    <div className={style.collectionName}>{name}</div>
                  </div>
                );
              }
            }
          ]
        },
        {
          width: columnsWidth[1],
          title: ({ sortColumns }: ColumnTitleProps<MarketTableRow>) => {
            const sortOrder = getColumnSortStatus(sortColumns, 'rate');
            return (
              <div
                className={
                  style.headerCell[
                    sortOrder === 'disabled' ? 'disabled' : 'active'
                  ]
                }
              >
              {showWeeklyRates ? 
              <> <span>Weekly rate</span>{' '} </> :
               <> <span>Yearly rate</span>{' '} </>}
                <div className={style.sortIcon[sortOrder]}>
                  <SorterIcon active={sortOrder !== 'disabled'} />
                </div>
              </div>
            );
          },
          dataIndex: 'rate',
          children: [
            {
              dataIndex: 'rate',
              key: 'rate',
              hidden: windowWidth < TABLET_BP,
              ellipsis: true,
              render: (rate: number) => {
                return (
                  <div className={c(style.rateCell, style.borrowRate)}>
                    {fp(rate / (showWeeklyRates ? 52 : 1))}
                  </div>
                );
              }
            }
          ],
          sorter: (a: MarketTableRow, b: MarketTableRow) => a.rate - b.rate
        },
        {
          width: columnsWidth[2],
          title: ({ sortColumns }: ColumnTitleProps<MarketTableRow>) => {
            const sortOrder = getColumnSortStatus(sortColumns, 'available');
            return (
              <div
                className={
                  style.headerCell[
                    sortOrder === 'disabled' ? 'disabled' : 'active'
                  ]
                }
              >
                <span>Supplied</span>{' '}
                <div className={style.sortIcon[sortOrder]}>
                  <SorterIcon active={sortOrder !== 'disabled'} />
                </div>
              </div>
            );
          },
          dataIndex: 'value',
          children: [
            {
              dataIndex: 'value',
              key: 'value',
              hidden: windowWidth < TABLET_BP,
              render: (value: number) => {
                return <div className={style.valueCell}>{fs(value)}</div>;
              }
            }
          ],
          sorter: (a: MarketTableRow, b: MarketTableRow) =>
            a.available - b.available
        },
        {
          width: columnsWidth[3],
          title: ({ sortColumns }: ColumnTitleProps<MarketTableRow>) => {
            const sortOrder = getColumnSortStatus(sortColumns, 'value');
            return (
              <div
                className={
                  style.headerCell[
                    sortOrder === 'disabled' ? 'disabled' : 'active'
                  ]
                }
              >
                <span>Available</span>
                <div className={style.sortIcon[sortOrder]}>
                  <SorterIcon active={sortOrder !== 'disabled'} />
                </div>
              </div>
            );
          },
          dataIndex: 'available',
          children: [
            {
              dataIndex: 'available',
              key: 'available',
              render: (available: number, data: MarketTableRow) => {
                return (
                  <div className={style.availableCell}>{fs(available)}</div>
                );
              }
            }
          ],
          sorter: (a: MarketTableRow, b: MarketTableRow) => a.value - b.value,
          render: (value: number, data: MarketTableRow) => {
            return <div className={style.valueCell}>{fs(value)}</div>;
          }
        },

        {
          width: columnsWidth[4],
          title: WeeklyToggle,
          render: (_: null, row: MarketTableRow) => {
            return (
              <div className={style.buttonsCell}>
                <HoneyButton variant="text">
                  View <div className={style.arrowIcon} />
                </HoneyButton>
              </div>
            );
          }
        }
      ].filter((column: HoneyTableColumnType<MarketTableRow>) => {
        // @ts-ignore
        if (column.children) {
          // @ts-ignore
          return !column?.children[0].hidden;
        }
        return !column.hidden;
      }),
    [
      isMyCollectionsFilterEnabled,
      tableData,
      showWeeklyRates,
      searchQuery,
      windowWidth
    ]
  );
  // Render func. for mobile
  const columnsMobile: ColumnType<MarketTableRow>[] = useMemo(
    () => [
      {
        width: columnsWidth[0],
        dataIndex: 'name',
        key: 'name',
        render: (name: string, row: MarketTableRow) => {
          return (
            <>
              <HoneyTableNameCell
                leftSide={
                  <>
                    <div className={style.logoWrapper}>
                      <div className={style.collectionLogo}>
                        <HexaBoxContainer>
                          {renderMarketImageByName(name)}
                        </HexaBoxContainer>
                      </div>
                    </div>
                    <div className={style.nameCellMobile}>
                      <div className={style.collectionName}>
                        {formatNFTName(name, 20)}
                      </div>
                      {/* <div className={style.rateCellMobile}>
                        {fp(row.rate * 100)}
                      </div> */}
                    </div>
                  </>
                }
                rightSide={
                  <div className={style.buttonsCell}>
                    <HoneyButton variant="text">
                      View <div className={style.arrowIcon} />
                    </HoneyButton>
                  </div>
                }
              />
              <HoneyTableRow>
                <div className={style.rateCell}>
                  {fp(row.rate / (showWeeklyRates ? 52 : 1))}
                </div>
                <div className={style.availableCell}>{fs(row.value)}</div>
                <div className={style.availableCell}>{fs(row.available)}</div>
              </HoneyTableRow>
            </>
          );
        }
      }
    ],
    [isMyCollectionsFilterEnabled, tableData, searchQuery, showWeeklyRates]
  );

  // position in each market
  const expandColumns: ColumnType<MarketTablePosition>[] = [
    {
      dataIndex: 'name',
      width: columnsWidth[0],
      render: (name, record) => {
        return (
          <div className={style.expandedRowNameCell}>
            <div className={style.expandedRowIcon}>
              <ExpandedRowIcon />
            </div>
            <div className={style.collectionLogo}>
              <HexaBoxContainer>
                {
                  <Image
                    src={record.image ? record.image : ''}
                    alt=""
                    layout="fill"
                  />
                }
              </HexaBoxContainer>
            </div>
            <div className={style.nameCellText}>
              <HoneyTooltip title={name}>
                {renderMarketName(currentMarketId)}
              </HoneyTooltip>
              <HealthLvl healthLvl={healthPercent} />
            </div>
          </div>
        );
      }
    },
    {
      dataIndex: 'debt',
      width: columnsWidth[1],
      render: debt => (
        <div className={style.expandedRowCell}>
          <InfoBlock title={'Debt:'} value={fs(userDebt)} />
        </div>
      )
    },
    {
      dataIndex: 'allowance',
      width: columnsWidth[2],
      render: allowance => (
        <div className={style.expandedRowCell}>
          <InfoBlock title={'Allowance:'} value={fs(userAllowance)} />
        </div>
      )
    },
    {
      dataIndex: 'value',
      width: columnsWidth[3],
      render: value => (
        <div className={style.expandedRowCell}>
          <InfoBlock title={'Value:'} value={fs(nftPrice)} />
        </div>
      )
    },
    {
      width: columnsWidth[4],
      title: '',
      render: () => (
        <div className={style.buttonsCell}>
          <HoneyButton variant="text">
            Manage <div className={style.arrowRightIcon} />
          </HoneyButton>
        </div>
      )
    }
  ];

  const expandColumnsMobile: ColumnType<MarketTablePosition>[] = [
    {
      dataIndex: 'name',
      render: (name, record) => (
        <div className={style.expandedRowNameCell}>
          <div className={style.expandedRowIcon}>
            <ExpandedRowIcon />
          </div>
          <div className={style.collectionLogo}>
            <HexaBoxContainer>
              {renderMarketImageByID(currentMarketId)}
            </HexaBoxContainer>
          </div>
          <div className={style.nameCellText}>
            <div className={style.collectionNameMobile}>{name}</div>
            <HealthLvl healthLvl={healthPercent} />
          </div>
        </div>
      )
    },
    // {
    //   dataIndex: 'debt',
    //   render: debt => (
    //     <div className={style.expandedRowCell}>
    //       <InfoBlock title={'Debt:'} value={fs(userDebt)} />
    //     </div>
    //   )
    // },
    // {
    //   dataIndex: 'available',
    //   render: available => (
    //     <div className={style.expandedRowCell}>
    //       <InfoBlock title={'Allowance:'} value={fs(nftPrice * MAX_LTV)} />
    //     </div>
    //   )
    // },
    {
      title: '',
      width: '50px',
      render: () => (
        <div className={style.buttonsCell}>
          <HoneyButton variant="text">
            Manage <div className={style.arrowRightIcon} />
          </HoneyButton>
        </div>
      )
    }
  ];

  const ExpandedTableFooter = () => (
    <div className={style.expandedSection}>
      <div className={style.expandedSectionFooter}>
        <div className={style.expandedRowIcon}>
          <ExpandedRowIcon />
        </div>
        <div className={style.collectionLogo}>
          <HexaBoxContainer borderColor="gray">
            <div className={style.lampIconStyle} />
          </HexaBoxContainer>
        </div>
        <div className={style.footerText}>
          <span className={style.footerTitle}>
            You can not add any more NFTs to this market{' '}
          </span>
          <span className={style.footerDescription}>
            Choose another market or connect a different wallet{' '}
          </span>
        </div>
      </div>
      <div className={style.footerButton}>
        <HoneyButton
          className={style.mobileConnectButton}
          variant="secondary"
          block={windowWidth < TABLET_BP}
          onClick={disconnect}
        >
          <div className={style.swapWalletIcon} />
          Change active wallet{' '}
        </HoneyButton>
      </div>
    </div>
  );

  /**
   * @description executes Deposit NFT (SDK helper)
   * @params mint of the NFT | toast | name | verified creator
   * @returns succes | failure
   */
  async function executeDepositNFT(
    mintID: any,
    toast: ToastProps['toast'],
    name: string,
    creator: string
  ) {
    try {
      if (!mintID) return;
      toast.processing();
      // loop through collections -> verified creator is used for validation
      marketCollections.map(async collection => {
        if (collection.verifiedCreator === creator) {
          const metadata = await Metadata.findByMint(
            collection.connection,
            mintID
          );

          const tx = await depositNFT(
            collection.connection,
            honeyUser,
            metadata.pubkey
          );

          if (tx[0] == 'SUCCESS') {
            const confirmation = tx[1];
            const confirmationHash = confirmation[0];

            await waitForConfirmation(
              sdkConfig.saberHqConnection,
              confirmationHash
            );
            if (collection.marketData) {
              await collection.marketData[0].reserves[0].refresh();
              await collection.marketData[0].user.refresh();

              await refreshPositions();
              refetchNfts({});

              toast.success(
                'Deposit success',
                `https://solscan.io/tx/${tx[1][0]}?cluster=${network}`
              );
            } else {
              await refreshPositions();
              refetchNfts({});

              toast.success(
                'Deposit success',
                `https://solscan.io/tx/${tx[1][0]}?cluster=${network}`
              );
            }
          }
        }
      });
    } catch (error) {
      return toast.error(
        'Error depositing NFT'
        // 'Transaction link(if available)'
      );
    }
  }

  /**
   * @description executes the withdraw NFT func. from SDK
   * @params mint of the NFT
   * @returns succes | failure
   */
  async function executeWithdrawNFT(mintID: any, toast: ToastProps['toast']) {
    try {
      if (!mintID) return toast.error('Please select NFT');
      toast.processing();

      const metadata = await Metadata.findByMint(
        sdkConfig.saberHqConnection,
        mintID
      );
      const tx = await withdrawNFT(
        sdkConfig.saberHqConnection,
        honeyUser,
        metadata.pubkey
      );

      if (tx[0] == 'SUCCESS') {
        const confirmation = tx[1];
        const confirmationHash = confirmation[0];

        await waitForConfirmation(
          sdkConfig.saberHqConnection,
          confirmationHash
        );

        if (fetchedDataObject) {
          await fetchedDataObject.reserves[0].refresh();
          await fetchedDataObject.user.refresh();

          await refreshPositions();
          refetchNfts({});

          toast.success(
            'Withdraw success',
            `https://solscan.io/tx/${tx[1][0]}?cluster=${network}`
          );
        } else {
          await refreshPositions();
          refetchNfts({});

          toast.success(
            'Withdraw success',
            `https://solscan.io/tx/${tx[1][0]}?cluster=${network}`
          );
        }
      }

      return true;
    } catch (error) {
      toast.error('Error withdraw NFT');
      return;
    }
  }

  /**
   * @description executes the borrow function which allows user to borrow against NFT
   * @params borrow amount
   * @returns borrowTx
   */
  async function executeBorrow(val: any, toast: ToastProps['toast']) {
    try {
      if (!val) return toast.error('Please provide a value');
      // if (val == 1.6) val = val - 0.01;
      const borrowTokenMint = new PublicKey(
        'So11111111111111111111111111111111111111112'
      );
      toast.processing();
      const tx = await borrowAndRefresh(
        honeyUser,
        val * LAMPORTS_PER_SOL,
        borrowTokenMint,
        honeyReserves
      );

      if (tx[0] == 'SUCCESS') {
        const confirmation = tx[1];
        const confirmationHash = confirmation[1];

        await waitForConfirmation(
          sdkConfig.saberHqConnection,
          confirmationHash
        );

        if (fetchedDataObject) {
          await fetchedDataObject.reserves[0].refresh();
          await fetchedDataObject.user.refresh();

          await refreshPositions();
          refetchNfts({});

          reserveHoneyState === 0
            ? setReserveHoneyState(1)
            : setReserveHoneyState(0);

          toast.success(
            'Borrow success',
            `https://solscan.io/tx/${tx[1][0]}?cluster=${network}`
          );
        } else {
          await refreshPositions();
          refetchNfts({});

          toast.success(
            'Borrow success',
            `https://solscan.io/tx/${tx[1][0]}?cluster=${network}`
          );
        }
      } else {
        return toast.error('Borrow failed');
      }
    } catch (error) {
      return toast.error('An error occurred');
    }
  }

  /**
   * @description
   * executes the repay function which allows user to repay their borrowed amount
   * against the NFT
   * @params amount of repay
   * @returns repayTx
   */
  async function executeRepay(val: any, toast: ToastProps['toast']) {
    try {
      if (!val) return toast.error('Please provide a value');
      const repayTokenMint = new PublicKey(
        'So11111111111111111111111111111111111111112'
      );
      toast.processing();
      const tx = await repayAndRefresh(
        honeyUser,
        val * LAMPORTS_PER_SOL,
        repayTokenMint,
        honeyReserves
      );

      if (tx[0] == 'SUCCESS') {
        const confirmation = tx[1];
        const confirmationHash = confirmation[1];

        await waitForConfirmation(
          sdkConfig.saberHqConnection,
          confirmationHash
        );

        if (fetchedDataObject) {
          await fetchedDataObject.reserves[0].refresh();
          await fetchedDataObject.user.refresh();

          await refreshPositions();
          refetchNfts({});

          reserveHoneyState === 0
            ? setReserveHoneyState(1)
            : setReserveHoneyState(0);

          toast.success(
            'Repay success',
            `https://solscan.io/tx/${tx[1][0]}?cluster=${network}`
          );
        } else {
          await refreshPositions();
          refetchNfts({});

          toast.success(
            'Repay success',
            `https://solscan.io/tx/${tx[1][0]}?cluster=${network}`
          );
        }
      } else {
        return toast.error('Repay failed');
      }
    } catch (error) {
      return toast.error('An error occurred');
    }
  }

  const borrowSidebar = (sidebarMode: BorrowSidebarMode) => {
    switch (sidebarMode) {
      case BorrowSidebarMode.MARKET:
        return (
          <HoneySider isMobileSidebarVisible={isMobileSidebarVisible}>
            {/* borrow repay module */}
            <MarketsSidebar
              openPositions={userOpenPositions}
              nftPrice={nftPrice}
              executeDepositNFT={executeDepositNFT}
              executeWithdrawNFT={executeWithdrawNFT}
              executeBorrow={executeBorrow}
              executeRepay={executeRepay}
              userDebt={userDebt}
              userAllowance={userAllowance}
              loanToValue={loanToValue}
              hideMobileSidebar={hideMobileSidebar}
              fetchedSolPrice={fetchedSolPrice}
              // TODO: call helper function include all markets
              calculatedInterestRate={activeInterestRate}
              currentMarketId={currentMarketId}
              availableNFTS={NFTs}
            />
          </HoneySider>
        );
      case BorrowSidebarMode.CREATE_MARKET:
        return (
          <HoneySider isMobileSidebarVisible={isMobileSidebarVisible}>
            <CreateMarketSidebar
              onCancel={() => {
                setSidebarMode(BorrowSidebarMode.MARKET);
              }}
              wallet={wallet}
              honeyClient={honeyClient}
            />
          </HoneySider>
        );
      default:
        return null;
    }
  };

  return (
    <LayoutRedesign>
      <HoneyContent sidebar={borrowSidebar(sidebarMode)}>
        <div>
          <Typography.Title className={pageTitle}>Borrow</Typography.Title>
          <Typography.Text className={pageDescription}>
            Get instant liquidity using your NFTs as collateral{' '}
          </Typography.Text>
        </div>
        {/* TODO: mock modal run*/}
        <div className={style.hideTablet}>
          <HoneyTable
            hasRowsShadow={true}
            tableLayout="fixed"
            selectedRowsKeys={
              sidebarMode === BorrowSidebarMode.MARKET
                ? [
                    tableDataFiltered.find(data => data.id === currentMarketId)
                      ?.key || ''
                  ]
                : []
            }
            columns={columns}
            dataSource={tableDataFiltered}
            pagination={false}
            onRow={(record, rowIndex) => {
              return {
                onClick: event => {
                  handleMarketId(record);
                  setSidebarMode(BorrowSidebarMode.MARKET);
                }
              };
            }}
            onHeaderRow={(data, index) => {
              if (index) {
                return {
                  hidden: true
                };
              }
              return {};
            }}
            className={classNames(style.table, {
              [style.emptyTable]: !tableDataFiltered.length
            })}
            expandable={{
              // we use our own custom expand column
              showExpandColumn: false,
              onExpand: (expanded, row) => {
                setExpandedRowKeys(expanded ? [row.key] : []);
              },
              expandedRowKeys,
              expandedRowRender: record => {
                return (
                  <>
                    <div>
                      <div
                        className={style.expandSection}
                        onClick={showMobileSidebar}
                      >
                        <div className={style.dashedDivider} />
                        <HoneyTable
                          tableLayout="fixed"
                          className={style.expandContentTable}
                          columns={expandColumns}
                          dataSource={record.openPositions}
                          pagination={false}
                          showHeader={false}
                          footer={
                            record.openPositions.length
                              ? ExpandedTableFooter
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  </>
                );
              }
            }}
          />
        </div>
        <div className={style.showTablet}>
          <div
            className={c(
              style.mobileTableHeader,
              style.mobileSearchAndToggleContainer
            )}
          >
            <div className={c(style.mobileRow, style.mobileSearchContainer)}>
              <SearchForm />
            </div>
            <div className={c(style.mobileToggleContainer)}>
              <WeeklyToggle />
            </div>
          </div>
          <div className={c(style.mobileTableHeader)}>
            <div className={style.tableCell}>Interest</div>
            <div className={style.tableCell}>Supplied</div>
            <div className={style.tableCell}>Available</div>
          </div>
          <HoneyTable
            hasRowsShadow={true}
            tableLayout="fixed"
            columns={columnsMobile}
            dataSource={tableDataFiltered}
            pagination={false}
            showHeader={false}
            onRow={(record, rowIndex) => {
              return {
                onClick: event => {
                  handleMarketId(record);
                  setSidebarMode(BorrowSidebarMode.MARKET);
                }
              };
            }}
            className={classNames(style.table, {
              [style.emptyTable]: !tableData.length
            })}
            expandable={{
              // we use our own custom expand column
              showExpandColumn: false,
              onExpand: (expanded, row) =>
                setExpandedRowKeys(expanded ? [row.key] : []),
              expandedRowKeys,
              expandedRowRender: record => {
                return (
                  <>
                    <div>
                      <div
                        className={style.expandSection}
                        onClick={showMobileSidebar}
                      >
                        <div className={style.dashedDivider} />
                        <HoneyTable
                          className={style.expandContentTable}
                          columns={expandColumnsMobile}
                          dataSource={record.openPositions}
                          pagination={false}
                          showHeader={false}
                          footer={
                            record.openPositions.length
                              ? ExpandedTableFooter
                              : () => (
                                  <HoneyButton variant="secondary" block>
                                    Deposit{' '}
                                    <div className={style.arrowRightIcon} />
                                  </HoneyButton>
                                )
                          }
                        />
                      </div>
                    </div>
                  </>
                );
              }
            }}
          />
        </div>
        {!tableDataFiltered.length &&
          (isMyCollectionsFilterEnabled ? (
            <div className={style.emptyStateContainer}>
              <EmptyStateDetails
                icon={<div className={style.docIcon} />}
                title="You didn’t use any collections yet"
                description="Turn off the filter my collection and choose any collection to borrow money"
              />
            </div>
          ) : (
            <div className={style.emptyStateContainer}>
              <EmptyStateDetails
                icon={<div className={style.docIcon} />}
                title="No collections to display"
                description="Turn off all filters and clear search inputs"
              />
            </div>
          ))}
        {
          <div
            className={style.createMarketLauncherCell}
            // style={{ width: launchAreaWidth }}
            onClick={() => setSidebarMode(BorrowSidebarMode.CREATE_MARKET)}
          >
            <div className={style.createMarket}>
              <div className={style.nameCell}>
                <div className={style.logoWrapper}>
                  <div className={style.createMarketLogo}>
                    <HexaBoxContainer borderColor="gray">
                      <div className={style.createMarketIconStyle} />
                    </HexaBoxContainer>
                  </div>
                </div>
                <div className={style.createMarketTitle}>
                  Do you want to create a new one?
                </div>
              </div>
              <div className={style.buttonsCell}>
                <HoneyButton variant="text">
                  Create{' '}
                  <div
                    className={c(style.arrowRightIcon, {
                      [style.createMarketHover]: isCreateMarketAreaOnHover
                    })}
                  />
                </HoneyButton>
              </div>
            </div>
          </div>
        }
      </HoneyContent>
    </LayoutRedesign>
  );
};

export default Markets;
