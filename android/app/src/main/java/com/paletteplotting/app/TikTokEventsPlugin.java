package com.paletteplotting.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.tiktok.TikTokBusinessSdk;
import com.tiktok.appevents.base.EventName;
import com.tiktok.appevents.base.TTBaseEvent;
import com.tiktok.appevents.contents.TTCheckoutEvent;
import com.tiktok.appevents.contents.TTContentParams;
import com.tiktok.appevents.contents.TTContentsEvent;
import com.tiktok.appevents.contents.TTContentsEventConstants.Currency;
import com.tiktok.appevents.contents.TTPurchaseEvent;
import com.tiktok.appevents.contents.TTViewContentEvent;
import java.util.Locale;

@CapacitorPlugin(name = "TikTokEvents")
public class TikTokEventsPlugin extends Plugin {

    @PluginMethod
    public void identify(PluginCall call) {
        if (!TikTokBusinessSdk.isInitialized()) {
            call.resolve();
            return;
        }

        TikTokBusinessSdk.identify(
                nullToEmpty(call.getString("externalId")),
                nullToEmpty(call.getString("externalUserName")),
                nullToEmpty(call.getString("phoneNumber")),
                nullToEmpty(call.getString("email")));
        call.resolve();
    }

    @PluginMethod
    public void logout(PluginCall call) {
        if (!TikTokBusinessSdk.isInitialized()) {
            call.resolve();
            return;
        }

        TikTokBusinessSdk.logout();
        call.resolve();
    }

    @PluginMethod
    public void trackEvent(PluginCall call) {
        if (!TikTokBusinessSdk.isInitialized()) {
            call.resolve();
            return;
        }

        String eventName = call.getString("eventName");
        if (eventName == null || eventName.trim().isEmpty()) {
            call.reject("eventName is required");
            return;
        }

        try {
            String trimmed = eventName.trim();
            String normalized = trimmed.replace(" ", "").replace("_", "").toLowerCase(Locale.US);

            switch (normalized) {
                case "viewcontent":
                    TikTokBusinessSdk.trackTTEvent(
                            fillBuilder(TTViewContentEvent.newBuilder(), call).build());
                    break;
                case "purchase":
                    TikTokBusinessSdk.trackTTEvent(
                            fillBuilder(TTPurchaseEvent.newBuilder(), call).build());
                    break;
                case "checkout":
                case "initiatecheckout":
                    TikTokBusinessSdk.trackTTEvent(
                            fillBuilder(TTCheckoutEvent.newBuilder(), call).build());
                    break;
                default:
                    EventName standardEvent = parseStandardEvent(trimmed);
                    if (standardEvent != null) {
                        TikTokBusinessSdk.trackTTEvent(standardEvent);
                    } else {
                        TikTokBusinessSdk.trackTTEvent(TTBaseEvent.newBuilder(trimmed).build());
                    }
                    break;
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("trackEvent failed: " + e.getMessage());
        }
    }

    private TTContentsEvent.Builder fillBuilder(TTContentsEvent.Builder builder, PluginCall call) {
        String description = call.getString("description");
        if (description != null && !description.isEmpty()) {
            builder.setDescription(description);
        }

        String currencyCode = call.getString("currency");
        if (currencyCode != null && !currencyCode.isEmpty()) {
            builder.setCurrency(parseCurrency(currencyCode));
        }

        Double value = call.getDouble("value");
        if (value != null && value > 0) {
            builder.setValue(value);
        }

        String contentType = call.getString("contentType");
        if (contentType != null && !contentType.isEmpty()) {
            builder.setContentType(contentType);
        }

        TTContentParams contentParams = buildContentParams(call);
        if (contentParams != null) {
            builder.setContents(contentParams);
        }

        return builder;
    }

    private TTContentParams buildContentParams(PluginCall call) {
        TTContentParams.Builder contentBuilder = TTContentParams.newBuilder();
        boolean hasContent = false;

        String contentId = call.getString("contentId");
        if (contentId != null && !contentId.isEmpty()) {
            contentBuilder.setContentId(contentId);
            hasContent = true;
        }

        String contentName = call.getString("contentName");
        if (contentName != null && !contentName.isEmpty()) {
            contentBuilder.setContentName(contentName);
            hasContent = true;
        }

        String contentCategory = call.getString("contentCategory");
        if (contentCategory != null && !contentCategory.isEmpty()) {
            contentBuilder.setContentCategory(contentCategory);
            hasContent = true;
        }

        String brand = call.getString("brand");
        if (brand != null && !brand.isEmpty()) {
            contentBuilder.setBrand(brand);
            hasContent = true;
        }

        Double price = call.getDouble("price");
        if (price != null && price > 0) {
            contentBuilder.setPrice(price.floatValue());
            hasContent = true;
        }

        Double quantity = call.getDouble("quantity");
        if (quantity != null && quantity > 0) {
            contentBuilder.setQuantity(quantity.intValue());
            hasContent = true;
        }

        return hasContent ? contentBuilder.build() : null;
    }

    private EventName parseStandardEvent(String eventName) {
        String key = eventName.trim().toUpperCase(Locale.US).replace(" ", "_");
        if (key.equals("LAUNCHAPP")) {
            key = "LAUNCH_APP";
        }
        try {
            return EventName.valueOf(key);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private Currency parseCurrency(String code) {
        try {
            return Currency.valueOf(code.trim().toUpperCase(Locale.US));
        } catch (IllegalArgumentException ignored) {
            return Currency.USD;
        }
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}

