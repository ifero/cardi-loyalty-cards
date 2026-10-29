package com.iferoporefi.myloyaltycards.wear.presentation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.Card
import androidx.wear.compose.material3.CardDefaults
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.SurfaceTransformation
import androidx.wear.compose.material3.Text
import com.iferoporefi.myloyaltycards.wear.R
import com.iferoporefi.myloyaltycards.wear.data.WearCard
import com.iferoporefi.myloyaltycards.wear.presentation.theme.Cream
import com.iferoporefi.myloyaltycards.wear.presentation.theme.FavoriteStarTint
import com.iferoporefi.myloyaltycards.wear.presentation.theme.Hairline
import com.iferoporefi.myloyaltycards.wear.presentation.theme.Ink

/**
 * One card row, on the watch grammar (`cardi-watch-grammar.md` §5.3, §4.4, §7.2): an ink row on
 * the black ground carrying a colour accent bar, an initials avatar in the brand/card colour with
 * ink or cream initials by its luminance, the card name in cream (truncated, never wrapped), and a
 * beam favourite star when pinned — no plate behind it. The M3 ripple is the press feedback (§3.1).
 *
 * Built on the Wear M3 [Card] so it gets, idiomatically and for free, the tap target, the
 * merged accessibility node, and — crucially — the [transformation] that makes the row scale and
 * fade toward the screen edges inside a [androidx.wear.compose.foundation.lazy.TransformingLazyColumn]
 * (the round-screen legibility idiom). The card is styled to the ported [CardRowMetrics], not the
 * M3 defaults, and enforces the 48 dp Android tap-target minimum (AC9).
 *
 * @param transformation built by the list from the item scope + shared spec; drives the morph.
 * @param onClick the single navigation seam Story 10-4 fills with the barcode screen (AC11).
 */
@Composable
fun CardRow(
    card: WearCard,
    transformation: SurfaceTransformation,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val presentation = remember(card) { presentationFor(card) }
    val avatarColor = presentation.avatarColor.toColor()
    val rowContentDescription = stringResource(
        if (card.isFavorite) R.string.card_row_favorite_content_description else R.string.card_row_content_description,
        card.name,
    )

    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = Ink),
        shape = RoundedCornerShape(CardRowMetrics.cornerRadius),
        // A near-black avatar (e.g. a `#000000` brand) all but vanishes on the ink row; the
        // system's dark-outline hairline keeps the row legible on OLED black, as on watchOS.
        border = if (presentation.isNearBlackAvatar) {
            BorderStroke(1.dp, Hairline)
        } else {
            null
        },
        contentPadding = PaddingValues(
            horizontal = CardRowMetrics.horizontalPadding,
            vertical = CardRowMetrics.verticalPadding,
        ),
        transformation = transformation,
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = CardRowMetrics.minimumTapHeight) // 48 dp tap target (AC9)
            .semantics(mergeDescendants = true) { contentDescription = rowContentDescription },
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(CardRowMetrics.rowSpacing),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(width = CardRowMetrics.accentWidth, height = CardRowMetrics.accentHeight)
                    .clip(RoundedCornerShape(CardRowMetrics.accentCornerRadius))
                    .background(avatarColor),
            )

            Box(
                modifier = Modifier
                    .size(CardRowMetrics.avatarSize)
                    .clip(CircleShape)
                    .background(avatarColor),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = presentation.initials,
                    // Light text below the 0.4 luminance line is cream, dark text above it is ink.
                    color = if (presentation.useWhiteText) Cream else Ink,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                )
            }

            Text(
                text = card.name,
                color = Cream,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )

            if (card.isFavorite) {
                Icon(
                    painter = painterResource(R.drawable.ic_star_filled),
                    contentDescription = null, // the row's merged label already announces "Favourite card, …"
                    tint = FavoriteStarTint,
                    modifier = Modifier.size(14.dp),
                )
            }
        }
    }
}

/** Converts a framework-free [Rgb] to a Compose [Color] at the edge of the pure colour maths. */
private fun Rgb.toColor(): Color = Color(red = red, green = green, blue = blue)
