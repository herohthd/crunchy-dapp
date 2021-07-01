import tzkt from './tzkt'
import { BigNumber } from 'bignumber.js';

export default {

  isFa1 (token) {
    return Object.prototype.hasOwnProperty.call(token.tokenType, 'fa1');
  },

  isFa2 (token) {
    return Object.prototype.hasOwnProperty.call(token.tokenType, 'fa2');
  },

  overrideMetadata (meta) {
    if (meta.tokenAddress === "KT1BHCumksALJQJ8q8to2EPigPW6qpyTr7Ng") {
      meta.name = "Crunchy";
    }

    if (meta.tokenAddress === "KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV") {
      meta.thumbnailUri = "https://kolibri-data.s3.amazonaws.com/logo.png";
    }

    if (meta.tokenAddress === "KT1KEsRsSMvSkgZ9CwYy5fPA1e4j3TEpuiKK") {
      meta.symbol = "oldWEED";
      meta.name = "Weed (Old)";
    }

    if (meta.tokenAddress === "KT1UHNDNjrCAAiRbzZrtQF9qHSHVMYeJyX1y") {
      meta.thumbnailUri = "ipfs://bafybeib56p33fpcg6oeero7ewwtuel2kzarcqvjr4p6llrj4o4jtgj7ljy";
    }

    if (meta.tokenAddress === "KT1GUNKmkrgtMQjJp3XxcmCj6HZBhkUmMbge") {
      meta.thumbnailUri = "ipfs://bafybeihbpuxewl5y5ks52tdfsyi4ocfdjwg6oxbok27cxv5gf5t5r3shne";
    }

    if (meta.tokenAddress === "KT1Ph8ptSU4rf7PPg2YBMR6LTpr6rc4MMyrq") {
      meta.thumbnailUri = "ipfs://Qme7epqauUCDt6J1oqwqEiDVUBSUbCQg6e9j3QoJGkv3vP";
    }

    // HEH
    if (meta.tokenAddress === "KT1G1cCRNBgQ48mVDjopHjEmTN5Sbtar8nn9") {
      meta.thumbnailUri = "ipfs://QmXL3FZ5kcwXC8mdwkS1iCHS2qVoyg69ugBhU2ap8z1zcs";
    }

    return meta;
  },

  getBadges (farm) {
    let badges = {
      verified: false,
      core: false,
      partner: false,
      lpLocked: false
    };

    // crunchy1
    if (farm.owner === "tz1hD63wN8p9V8o5ARU7wA7RKAQvBAwkeTr7") {
      badges.verified = true;
      badges.core = true;
    }

    // crunchy4
    if (farm.owner === "tz1ZZZPNqHprYjJzxXS6HfucYKKgHZUsVu1z") {
      badges.verified = true;
      badges.partner = true;
    }

    // crunchy7
    if (farm.owner === "tz1RMXfVec1xFHznQvk48hzQjBuqeVL9LLUE") {
      badges.verified = true;

      // DER
      if (farm.rewardToken.address === "KT1SiFqDqeFcUi5vQVSvuxB2g4xz7WLBrDek") {
        badges.partner = true;
      }
      if (farm.rewardToken.address === "KT1TCPf4DjgsseHj8ixRnCBgToqZbdFHQtPA") {
        badges.partner = true;
      }
      if (farm.rewardToken.address === "KT1Wa2ncR8GbeQrW6Dbtpc8uTrK7q5CH4F2Q") {
        badges.partner = true;
      }
      if (farm.rewardToken.address === "KT1M2Ws52krJrwJi1ZFsmVfazBiafWYKZTvd") {
        badges.partner = true;
      }
    }

    // XTZ/CRUNCH
    if (farm.poolToken.address === "KT1RRgK6eXvCWCiEGWhRZCSVGzhDzwXEEjS4") {
      badges.lpLocked = true;
    }

    // FARM
    if (farm.rewardToken.address === "KT1CnuKyaAuYBAwJf9g5LobtxRZsF2KCD3o6") {
      badges.partner = true;
    }

    // Catz
    if (farm.rewardToken.address === "KT1Ph8ptSU4rf7PPg2YBMR6LTpr6rc4MMyrq") {
      badges.verified = false;
    }

    // PUMP
    if (farm.rewardToken.address === "KT1Qryr8PrH3YGcDbbddwvp8X1acQ5v2zKhA") {
      badges.verified = false;
    }

    // BDoge
    if (farm.rewardToken.address === "KT1EMarewvdmyV42FDgGuhUhTKxrjutQWEBA") {
      badges.verified = false;
    }

    // DER
    if (farm.owner === "tz1Vb19E2Hh4JcerACeF1AJPkPSL63d5KAcF") {
      badges.verified = true;
      badges.partner = true;
    }

    return badges;
  },

  calcMultiplier (farm) {
    let m = 0;
    if (farm.id < 16) {
      m = 1;
    }
    for (const bonus of farm.bonuses) {
      if (new Date(bonus.endTime) > new Date()) {
        m += parseInt(bonus.multiplier);
      }
    }
    return m || 1;
  },

  async getUserRecord (farm, pkh) {
    const res = await tzkt.getContractBigMapKeys(farm.contract, 'ledger', {
      'key.nat': farm.id,
      'key.address': pkh
    });

    if (res.data.length === 0) {
      return {
        amount: 0,
        rewardDebt: 0,
        lockEndTime: null,
        vault: ""
      };
    }

    const ret = res.data[0].value;
    ret.amountRaw = ret.amount;
    ret.amount = parseInt(ret.amount) / (10 ** farm.poolToken.decimals);
    return ret;
  },

  estimatePendingRewards (userRecord, farmStorage, currentRewardMultiplier) {
    const pendingRewards = new BigNumber(0);
    const rpsMultiplier = new BigNumber(1000000000000000);
    const bonusAccuracy = new BigNumber(1000);
    const userRecordAmount = new BigNumber(userRecord.amountRaw);
    const userRecordDebt = new BigNumber(userRecord.rewardDebt);
    const rewardPaid = new BigNumber(farmStorage.rewardPaid);
    const rewardSupply = new BigNumber(farmStorage.rewardSupply);
    let accRewardPerShare = new BigNumber(farmStorage.accRewardPerShare);

    let tokenRewards = new BigNumber(0);
    if (!currentRewardMultiplier.isZero()) {
      const rewardPerSec = new BigNumber(farmStorage.rewardPerSec);
      const poolBalance = new BigNumber(farmStorage.poolBalance);
      tokenRewards = currentRewardMultiplier.times(rewardPerSec).times(rpsMultiplier).idiv(bonusAccuracy).idiv(poolBalance);
    }

    accRewardPerShare = accRewardPerShare.plus(tokenRewards);

    const accRewards = userRecordAmount.times(accRewardPerShare).idiv(rpsMultiplier);

    if (rewardPaid.lt(rewardSupply) && accRewards.gt(userRecordDebt)) {
      const maxRewards = rewardSupply.minus(rewardPaid).abs();
      const owedRewards = accRewards.minus(userRecordDebt).abs();
      if (maxRewards.lt(owedRewards)) {
        return maxRewards;
      } else {
        return owedRewards;
      }
    }

    return pendingRewards;
  },

  getActiveBonuses (bonuses, startTime) {
    return bonuses.filter(bonus => (new Date(bonus.endTime)) >= startTime);
  },

  countOutlierSeconds (b, endTime) {
    let s = 0;
    if ((new Date(b.endTime)) < endTime) {
      s = s + Math.floor(Math.abs(endTime - (new Date(b.endTime))) / 1000);
    }
    return s;
  },

  getCurrentRewardMultiplier (farmStorage) {
    const bonusAccuracy = 1000;
    const minDate = (...dates) => new Date(Math.min(...dates));

    let m = 0;
    if ((new Date(farmStorage.startTime) < new Date())) {
      const startTime = new Date(farmStorage.lastRewardTime);
      const endTime = minDate(new Date(farmStorage.endTime), new Date());
      const activeBonuses = this.getActiveBonuses(farmStorage.bonuses, startTime);
      const totalNumSec = Math.floor(Math.abs(endTime - startTime) / 1000);

      let secNoBonus = totalNumSec;
      let bonusSec = 0;
      for (const b of activeBonuses) {
        const e = minDate(endTime, new Date(b.endTime));
        const s = Math.floor(Math.abs(e - startTime) / 1000);
        bonusSec = bonusSec + (Number(b.multiplier) * s * bonusAccuracy);
        secNoBonus = Math.min(secNoBonus, this.countOutlierSeconds(b, endTime));
      }

      m = bonusSec + (secNoBonus * bonusAccuracy);
    }
    return new BigNumber(m);
  }

}

// https://api.florencenet.tzkt.io/v1/operations/transactions?target=KT1KB6q8jvyrRQku48ysVJo4xaULPbUfcdps&entrypoint.in=deposit,withdraw,harvest&sort.desc=id
