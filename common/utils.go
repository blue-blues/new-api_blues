package common

import (
	"fmt"
	"github.com/songquanpeng/one-api/common/config"
)

func LogQuota(quota int64) string {
	if config.DisplayInCurrencyEnabled {
		return fmt.Sprintf("＄%.6f credits", float64(quota)/config.QuotaPerUnit)
	} else {
		return fmt.Sprintf("%d credits", quota)
	}
}
