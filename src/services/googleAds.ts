import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import { Alert, Button } from 'react-native';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

// Real ones

// const AD_UNIT_ID = 'ca-app-pub-9138199693214957/5211655924';

// const HOMEBANNER_AD_UNIT_ID = 'ca-app-pub-9138199693214957/6069958941';

// Testing purpose

const AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
});

const HOMEBANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/2934735716',
  android: 'ca-app-pub-3940256099942544/6300978111',
});

type Props = { onReward?: (amount: number, type: string) => void };

const initializeGoogleAds = async () => {
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
    });

    await mobileAds().initialize(); 
}

function RewardButton({ onReward }: Props) {
  const [rewarded, setRewarded] = useState<RewardedAd | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    const instance = RewardedAd.createForAdRequest(AD_UNIT_ID ?? "");
    setRewarded(instance);

    const unsubLoaded = instance.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setLoaded(true)
    );
    const unsubEarned = instance.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => onReward?.(reward.amount, reward.type)
    );
    const unsubClosed = instance.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setShowing(false);
        setLoaded(false);
        instance.load();
      }
    );
    const unsubError = instance.addAdEventListener(
      AdEventType.ERROR,
      () => {
        setShowing(false);
        setLoaded(false);
      }
    );

    instance.load();

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
    };
  }, [onReward]);
}

function createRewarded() {
  return RewardedAd.createForAdRequest(AD_UNIT_ID ?? "");
}

function showRewardedAd(onReward?: (amount: number, type: string) => void) {
  const [rewarded, setRewarded] = useState(createRewarded);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
        setLoading(false);
      }
    );
    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        onReward?.(reward.amount, reward.type);
      }
    );
    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      const newRewarded = createRewarded();
      setRewarded(newRewarded);
      setLoaded(false);
      setLoading(true);
      newRewarded.load();
    });
    const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      setLoading(false);
      setLoaded(false);
    });

    // prime the first ad
    rewarded.load();

    return () => {
      unsubLoaded(); unsubEarned(); unsubClosed(); unsubError();
    };
  }, [rewarded, onReward]);

  const show = useCallback(() => {
    if (!loaded) {
      setLoading(true);
      rewarded.load();
      return;
    }
    rewarded.show();
    setLoading(true); // set loading until CLOSED fires
  }, [loaded, rewarded]);

  return { show, loading, loaded };
}

export {
    initializeGoogleAds,
    RewardButton,
    showRewardedAd,
    HOMEBANNER_AD_UNIT_ID
}