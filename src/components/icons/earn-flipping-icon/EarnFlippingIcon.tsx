import styles from './styles.module.css';

export default function EarnFlippingIcon() {
  return (
    <div className={styles['coin-flip_container']}>
      <div className={styles['coin-flip_wrapper']}>
        <div className={styles['coin-flip_coinSide']} />
      </div>
      <div className={styles['coin-flip_wrapper']}>
        <div
          className={`${styles['coin-flip_coin']} ${styles['coin-flip_front']} ${styles['coin-flip_outer']}`}
        >
          <EarnIcon />
        </div>
        <div
          className={`${styles['coin-flip_coin']} ${styles['coin-flip_front']} ${styles['coin-flip_inner']}`}
        />
        <div
          className={`${styles['coin-flip_coin']} ${styles['coin-flip_back']} ${styles['coin-flip_outer']}`}
        >
          <EarnIcon />
        </div>
        <div
          className={`${styles['coin-flip_coin']} ${styles['coin-flip_back']} ${styles['coin-flip_inner']}`}
        />
      </div>
    </div>
  );
}

function EarnIcon() {
  return (
    <svg viewBox="0 0 105 105" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M69.8168 34.6826C68.1507 32.8653 66.1982 31.423 63.9588 30.3556L66.4857 19.4102L56.046 17L53.4609 28.1973C50.4303 28.2914 47.5932 28.8936 44.9496 30.0038C42.1193 31.1591 39.6646 32.8342 37.585 35.0292C35.5057 37.1664 33.8882 39.7079 32.7329 42.6539C31.5779 45.5998 31 48.8345 31 52.3582C31 56.9214 32.0396 60.9646 34.1193 64.4882C35.9174 67.5352 38.3204 70.0206 41.328 71.9445L38.2719 85.1823L48.7116 87.5924L51.4879 75.5666C52.8618 75.7479 54.2926 75.8386 55.7804 75.8386C57.8596 75.8386 59.9682 75.5785 62.1054 75.0589C64.2425 74.5389 66.3221 73.7882 68.3436 72.806C70.3654 71.7664 72.2139 70.4957 73.8889 68.9935L67.9971 60.7625C66.0911 62.3221 64.3004 63.4196 62.6254 64.055C60.95 64.6903 59.1018 65.0082 57.08 65.0082C54.1339 65.0082 51.5636 64.4593 49.3686 63.3618C47.2314 62.2064 45.5564 60.6182 44.3432 58.5964C43.6863 57.4469 43.2162 56.1761 42.9329 54.7839H75.6218L75.7086 50.9718C75.8239 47.6792 75.3618 44.6467 74.3221 41.8741C73.2825 39.1014 71.7807 36.7043 69.8168 34.6826ZM64.0982 47.246H43.0402C43.2683 46.2424 43.5872 45.3182 43.9968 44.4734C44.9211 42.5672 46.2493 41.1232 47.9825 40.1412C49.7729 39.1592 51.9389 38.6682 54.4807 38.6682C56.2136 38.6682 57.7732 39.0148 59.1593 39.7079C60.5457 40.4011 61.6721 41.3831 62.5386 42.6539C63.4629 43.9247 63.9825 45.3398 64.0982 46.8994V47.246Z"
        fill="#EEE6E6"
      />
    </svg>
  );
}
