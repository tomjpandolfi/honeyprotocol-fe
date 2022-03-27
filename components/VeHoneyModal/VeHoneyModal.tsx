import { Box, Button, Input, Stack, Text } from 'degen';
import React, { ChangeEvent, useState } from 'react';
import * as styles from './VeHoneyModal.css';

const VeHoneyModal = () => {
  const [amount, setAmount] = useState<number>();
  const [vestingPeriod, setVestingPeriod] = useState<number>(90);
  const veHoneyRewardRate =
    vestingPeriod === 90
      ? 2
      : vestingPeriod === 180
      ? 5
      : vestingPeriod === 360
      ? 10
      : 1;

  const onSubmit = () => {
    if (!amount) return;
    console.log({ amount, vestingPeriod });
  };

  return (
    <Box width="96">
      <Box borderBottomWidth="0.375" paddingX="6" paddingY="4">
        <Text variant="large" color="textPrimary" weight="bold" align="center">
          Get veHONEY
        </Text>
      </Box>
      <Box padding="6">
        <Stack space="6">
          <Text align="center" weight="semiBold">
            Deposit pHONEY and recieve veHONey
          </Text>
          <Stack space="2">
            <Text align="center" size="small">
              After vesting, you get:
            </Text>
            <Box
              marginX="auto"
              borderColor="accent"
              borderWidth="0.375"
              minHeight="7"
              borderRadius="large"
              display="flex"
              justifyContent="center"
              alignItems="center"
              width="3/4"
            >
              <Text variant="small" color="accent">
                {amount || '0'} pHONEY = {(amount || 0) * veHoneyRewardRate}{' '}
                HONEY
              </Text>
            </Box>
          </Stack>
          <Stack space="2">
            <Stack direction="horizontal" justify="space-between">
              <Text variant="small" color="textSecondary">
                Your pHoney deposited
              </Text>
              <Text variant="small">--</Text>
            </Stack>
            <Stack direction="horizontal" justify="space-between">
              <Text variant="small" color="textSecondary">
                Your pHONEY balance
              </Text>
              <Text variant="small">--</Text>
            </Stack>
            <Stack direction="horizontal" justify="space-between">
              <Text variant="small" color="textSecondary">
                Vesting period
              </Text>
              <Box>
                <select
                  name="vestingPeriod"
                  value={vestingPeriod}
                  className={styles.select}
                  onChange={event =>
                    setVestingPeriod(Number(event.target.value))
                  }
                >
                  <option value="90">3 months</option>
                  <option value="180">6 months</option>
                  <option value="360">12 months</option>
                </select>
              </Box>
            </Stack>
          </Stack>
          <Input
            value={amount}
            type="number"
            label="Amount"
            hideLabel
            units="pHONEY"
            // placeholder="0"
            onChange={event => setAmount(Number(event.target.value))}
          />
          <Button
            onClick={onSubmit}
            disabled={amount ? false : true}
            width="full"
          >
            {amount ? 'Deposit' : 'Enter amount'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default VeHoneyModal;
