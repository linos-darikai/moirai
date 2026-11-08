//! TopTen: the ten best Elo ratings (PLAN.md section 4). One account for the whole program,
//! updated by `settle_match`, so the leaderboard can be read without scanning every Profile.

use anchor_lang::prelude::*;

/// How many places the leaderboard keeps.
pub const TOP_TEN_SIZE: usize = 10;

/// One leaderboard place. An unused place has the default (all-zero) wallet.
#[derive(
    AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, Default, InitSpace,
)]
pub struct TopTenEntry {
    pub wallet: Pubkey,
    pub elo: u32,
}

/// The ten best ratings, best first.
#[account]
#[derive(InitSpace)]
pub struct TopTen {
    pub entries: [TopTenEntry; TOP_TEN_SIZE],
    /// This account's PDA bump.
    pub bump: u8,
}

impl TopTen {
    /// Puts `wallet` on the board with `elo` (replacing its old place, if any) and keeps the board
    /// sorted, best first. Drops whoever falls below tenth.
    pub fn record(&mut self, wallet: Pubkey, elo: u32) {
        // Step 1: take the wallet's old place out.
        let mut kept: Vec<TopTenEntry> = self
            .entries
            .iter()
            .copied()
            .filter(|entry| entry.wallet != wallet && entry.wallet != Pubkey::default())
            .collect();
        // Step 2: add it with the new rating, sort best first, keep ten.
        kept.push(TopTenEntry { wallet, elo });
        kept.sort_by(|a, b| b.elo.cmp(&a.elo));
        kept.truncate(TOP_TEN_SIZE);
        // Step 3: write back, padding with empty places.
        self.entries = [TopTenEntry::default(); TOP_TEN_SIZE];
        for (slot, entry) in self.entries.iter_mut().zip(kept) {
            *slot = entry;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn wallet(byte: u8) -> Pubkey {
        Pubkey::new_from_array([byte; 32])
    }

    fn empty_board() -> TopTen {
        TopTen {
            entries: [TopTenEntry::default(); TOP_TEN_SIZE],
            bump: 0,
        }
    }

    #[test]
    fn the_board_stays_sorted_best_first() {
        let mut board = empty_board();

        board.record(wallet(1), 1_200);
        board.record(wallet(2), 1_400);
        board.record(wallet(3), 1_300);

        let elos: Vec<u32> = board.entries[..3].iter().map(|entry| entry.elo).collect();
        assert_eq!(elos, vec![1_400, 1_300, 1_200]);
    }

    #[test]
    fn a_wallet_appears_once_with_its_latest_rating() {
        let mut board = empty_board();

        board.record(wallet(1), 1_200);
        board.record(wallet(1), 1_250);

        assert_eq!(
            board.entries[0],
            TopTenEntry {
                wallet: wallet(1),
                elo: 1_250
            }
        );
        assert_eq!(board.entries[1].wallet, Pubkey::default());
    }

    #[test]
    fn only_the_best_ten_are_kept() {
        let mut board = empty_board();

        for byte in 1..=11u8 {
            board.record(wallet(byte), 1_000 + u32::from(byte));
        }

        assert_eq!(board.entries[0].wallet, wallet(11));
        assert!(board.entries.iter().all(|entry| entry.wallet != wallet(1)));
    }
}
