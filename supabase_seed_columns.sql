-- ============================================
-- Seed fb_columns table with all 238 Facebook Ads columns
-- Run this AFTER supabase_schema.sql
-- ============================================

INSERT INTO fb_columns (key, label, category, data_type, is_default) VALUES
-- Campaign Structure
('campaign_name', 'Campaign Name', 'structure', 'text', true),
('campaign_id', 'Campaign ID', 'structure', 'text', false),
('adset_name', 'Ad Set Name', 'structure', 'text', true),
('adset_id', 'Ad Set ID', 'structure', 'text', false),
('ad_name', 'Ad Name', 'structure', 'text', true),
('ad_id', 'Ad ID', 'structure', 'text', false),
('account_name', 'Account Name', 'structure', 'text', false),
('account_id', 'Account ID', 'structure', 'text', false),
('objective', 'Objective', 'structure', 'text', true),
('buying_type', 'Buying Type', 'structure', 'text', false),

-- Delivery & Status
('effective_status', 'Campaign Delivery', 'delivery', 'text', true),
('date_start', 'Reporting Starts', 'delivery', 'date', true),
('date_stop', 'Reporting Ends', 'delivery', 'date', true),
('created_time', 'Date Created', 'delivery', 'date', false),
('updated_time', 'Date Last Edited', 'delivery', 'date', false),

-- Core Performance
('impressions', 'Impressions', 'performance', 'number', true),
('reach', 'Reach', 'performance', 'number', true),
('frequency', 'Frequency', 'performance', 'number', false),
('spend', 'Amount Spent (MYR)', 'performance', 'currency', true),
('clicks', 'Clicks (all)', 'performance', 'number', true),
('ctr', 'CTR (all)', 'performance', 'percentage', true),
('cpc', 'CPC (all) (MYR)', 'performance', 'currency', true),
('cpm', 'CPM (MYR)', 'performance', 'currency', false),
('cpp', 'Cost per 1,000 Accounts Centre accounts reached (MYR)', 'performance', 'currency', false),
('unique_impressions', 'Unique Impressions', 'performance', 'number', false),
('social_spend', 'Social Spend', 'performance', 'currency', false),

-- Link Clicks
('inline_link_clicks', 'Link Clicks', 'clicks', 'number', true),
('inline_link_click_ctr', 'CTR (link click-through rate)', 'clicks', 'percentage', true),
('cost_per_inline_link_click', 'CPC (cost per link click) (MYR)', 'clicks', 'currency', true),
('unique_link_clicks', 'Unique Link Clicks', 'clicks', 'number', false),
('unique_link_clicks_ctr', 'Unique CTR (link click-through rate)', 'clicks', 'percentage', false),
('cost_per_unique_link_click', 'Cost per Unique Link Click (MYR)', 'clicks', 'currency', false),
('unique_clicks', 'Unique Clicks (all)', 'clicks', 'number', false),
('unique_ctr', 'Unique CTR (all)', 'clicks', 'percentage', false),
('cost_per_unique_click', 'Cost per Unique Click (all) (MYR)', 'clicks', 'currency', false),

-- Outbound Clicks
('outbound_clicks:outbound_click', 'Outbound Clicks', 'clicks', 'number', false),
('outbound_clicks_ctr', 'Outbound CTR', 'clicks', 'percentage', false),
('cost_per_outbound_click', 'Cost per Outbound Click (MYR)', 'clicks', 'currency', false),
('unique_outbound_clicks:outbound_click', 'Unique Outbound Clicks', 'clicks', 'number', false),
('unique_outbound_clicks_ctr', 'Unique Outbound CTR', 'clicks', 'percentage', false),
('cost_per_unique_outbound_click', 'Cost per Unique Outbound Click (MYR)', 'clicks', 'currency', false),

-- Video
('actions:video_view', 'Video Plays', 'video', 'number', false),
('video_thruplay_watched_actions:video_view', 'ThruPlays', 'video', 'number', false),
('cost_per_thruplay:video_view', 'Cost per ThruPlay (MYR)', 'video', 'currency', false),
('video_continuous_2_sec_watched_actions:video_view', '2-Second Continuous Video Plays', 'video', 'number', false),
('video_30_sec_watched_actions:video_view', '3-Second Video Plays', 'video', 'number', false),
('video_p25_watched_actions:video_view', 'Video Plays at 25%', 'video', 'number', false),
('video_p50_watched_actions:video_view', 'Video Plays at 50%', 'video', 'number', false),
('video_p75_watched_actions:video_view', 'Video Plays at 75%', 'video', 'number', false),
('video_p95_watched_actions:video_view', 'Video Plays at 95%', 'video', 'number', false),
('video_p100_watched_actions:video_view', 'Video Plays at 100%', 'video', 'number', false),
('video_avg_time_watched_actions:video_view', 'Video Average Play Time', 'video', 'text', false),

-- Engagement Actions
('actions:post_engagement', 'Post Engagements', 'engagement', 'number', false),
('actions:page_engagement', 'Page Engagement', 'engagement', 'number', false),
('actions:post', 'Post Shares', 'engagement', 'number', false),
('actions:comment', 'Post Comments', 'engagement', 'number', false),
('actions:post_reaction', 'Post Reactions', 'engagement', 'number', false),
('actions:onsite_conversion.post_save', 'Post Saves', 'engagement', 'number', false),
('actions:like', 'Facebook Likes', 'engagement', 'number', false),
('actions:photo_view', 'Photo Clicks', 'engagement', 'number', false),
('actions:link_click', 'Link Clicks (action)', 'engagement', 'number', false),
('actions:rsvp', 'Event Responses', 'engagement', 'number', false),
('actions:follow', 'Instagram Follows', 'engagement', 'number', false),
('actions:checkin', 'Check-ins', 'engagement', 'number', false),
('cost_per_action_type:post_engagement', 'Cost per Post Engagement (MYR)', 'engagement', 'currency', false),
('cost_per_action_type:page_engagement', 'Cost per Page Engagement (MYR)', 'engagement', 'currency', false),
('cost_per_action_type:like', 'Cost per Like (MYR)', 'engagement', 'currency', false),
('cost_per_action_type:rsvp', 'Cost per Event Response (MYR)', 'engagement', 'currency', false),

-- Messaging
('actions:onsite_conversion.messaging_conversation_started_7d', 'Messaging Conversations Started', 'messaging', 'number', false),
('actions:onsite_conversion.messaging_first_reply', 'Messaging Contacts', 'messaging', 'number', false),
('actions:onsite_conversion.messaging_conversation_replied_7d', 'Messages Replied', 'messaging', 'number', false),
('actions:onsite_conversion.messaging_user_subscribed', 'Messaging User Subscribed', 'messaging', 'number', false),
('actions:onsite_conversion.messaging_welcome_message_view', 'Welcome Message Views', 'messaging', 'number', false),
('actions:onsite_conversion.messaging_user_call_placed', 'Messaging Calls Placed', 'messaging', 'number', false),
('cost_per_action_type:onsite_conversion.messaging_conversation_started_7d', 'Cost per Messaging Conversation (MYR)', 'messaging', 'currency', false),
('cost_per_action_type:onsite_conversion.messaging_first_reply', 'Cost per Messaging Contact (MYR)', 'messaging', 'currency', false),

-- Leads & Conversions
('actions:lead', 'Leads', 'conversions', 'number', true),
('action_values:lead', 'Leads Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:lead', 'Cost per Lead (MYR)', 'conversions', 'currency', true),
('actions:landing_page_view', 'Website Landing Page Views', 'conversions', 'number', false),
('cost_per_action_type:landing_page_view', 'Cost per Landing Page View (MYR)', 'conversions', 'currency', false),
('actions:omni_view_content', 'Content Views', 'conversions', 'number', false),
('action_values:omni_view_content', 'Content Views Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:omni_view_content', 'Cost per Content View (MYR)', 'conversions', 'currency', false),
('actions:omni_add_to_cart', 'Adds to Cart', 'conversions', 'number', false),
('action_values:omni_add_to_cart', 'Adds to Cart Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:omni_add_to_cart', 'Cost per Add to Cart (MYR)', 'conversions', 'currency', false),
('actions:omni_initiated_checkout', 'Checkouts Initiated', 'conversions', 'number', false),
('action_values:omni_initiated_checkout', 'Checkouts Initiated Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:omni_initiated_checkout', 'Cost per Checkout Initiated (MYR)', 'conversions', 'currency', false),
('actions:add_payment_info', 'Adds of Payment Info', 'conversions', 'number', false),
('action_values:add_payment_info', 'Adds of Payment Info Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:add_payment_info', 'Cost per Add of Payment Info (MYR)', 'conversions', 'currency', false),

-- Purchases & Revenue
('actions:purchase', 'Purchases', 'revenue', 'number', true),
('actions:omni_purchase', 'Purchases (omni)', 'revenue', 'number', false),
('action_values:purchase', 'Purchases Conversion Value', 'revenue', 'currency', true),
('action_values:omni_purchase', 'Purchases Conversion Value (omni)', 'revenue', 'currency', false),
('cost_per_action_type:purchase', 'Cost per Purchase (MYR)', 'revenue', 'currency', true),
('purchase_roas:purchase', 'Purchase ROAS', 'revenue', 'number', true),
('website_purchase_roas:purchase', 'Website Purchase ROAS', 'revenue', 'number', false),

-- Registration & Subscriptions
('actions:omni_complete_registration', 'Registrations Completed', 'conversions', 'number', false),
('action_values:omni_complete_registration', 'Registrations Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:omni_complete_registration', 'Cost per Registration (MYR)', 'conversions', 'currency', false),
('actions:subscribe', 'Subscriptions', 'conversions', 'number', false),
('cost_per_action_type:subscribe', 'Cost per Subscription (MYR)', 'conversions', 'currency', false),
('actions:start_trial', 'Trials Started', 'conversions', 'number', false),
('cost_per_action_type:start_trial', 'Cost per Trial Started (MYR)', 'conversions', 'currency', false),

-- App
('actions:app_install', 'App Installs', 'app', 'number', false),
('cost_per_action_type:app_install', 'Cost per App Install (MYR)', 'app', 'currency', false),
('actions:app_use', 'Desktop App Uses', 'app', 'number', false),
('cost_per_action_type:app_use', 'Cost per Desktop App Use (MYR)', 'app', 'currency', false),
('actions:app_custom_event', 'Custom Events', 'app', 'number', false),
('cost_per_action_type:app_custom_event', 'Cost per Custom Event (MYR)', 'app', 'currency', false),

-- Other Conversions
('actions:contact', 'Contacts', 'conversions', 'number', false),
('action_values:contact', 'Contact Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:contact', 'Cost per Contact (MYR)', 'conversions', 'currency', false),
('actions:search', 'Searches', 'conversions', 'number', false),
('action_values:search', 'Searches Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:search', 'Cost per Search (MYR)', 'conversions', 'currency', false),
('actions:find_location', 'Location Searches', 'conversions', 'number', false),
('cost_per_action_type:find_location', 'Cost per Location Search (MYR)', 'conversions', 'currency', false),
('actions:schedule', 'Appointments Scheduled', 'conversions', 'number', false),
('action_values:schedule', 'Appointments Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:schedule', 'Cost per Appointment (MYR)', 'conversions', 'currency', false),
('actions:submit_application', 'Applications Submitted', 'conversions', 'number', false),
('action_values:submit_application', 'Submit Application Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:submit_application', 'Cost per Application (MYR)', 'conversions', 'currency', false),
('actions:donate', 'Donations', 'conversions', 'number', false),
('action_values:donate', 'Donate Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:donate', 'Cost per Donation (MYR)', 'conversions', 'currency', false),
('actions:customize_product', 'Products Customised', 'conversions', 'number', false),
('action_values:customize_product', 'Customise Product Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:customize_product', 'Cost per Product Customised (MYR)', 'conversions', 'currency', false),
('actions:onsite_conversion.messaging_block', 'Blocks', 'conversions', 'number', false),
('actions:credit_spent', 'Credit Spends', 'conversions', 'number', false),
('action_values:credit_spent', 'Credit Spends Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:credit_spent', 'Cost per Credit Spend (MYR)', 'conversions', 'currency', false),
('actions:game_plays', 'Game Plays', 'conversions', 'number', false),
('cost_per_action_type:game_plays', 'Cost per Game Play (MYR)', 'conversions', 'currency', false),
('actions:achieve_level', 'Levels Achieved', 'conversions', 'number', false),
('action_values:achieve_level', 'Levels Achieved Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:achieve_level', 'Cost per Level Achieved (MYR)', 'conversions', 'currency', false),
('actions:rate', 'Ratings Submitted', 'conversions', 'number', false),
('action_values:rate', 'Ratings Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:rate', 'Cost per Rating (MYR)', 'conversions', 'currency', false),
('actions:unlock_achievement', 'Achievements Unlocked', 'conversions', 'number', false),
('action_values:unlock_achievement', 'Achievements Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:unlock_achievement', 'Cost per Achievement (MYR)', 'conversions', 'currency', false),
('actions:complete_tutorial', 'Tutorials Completed', 'conversions', 'number', false),
('action_values:complete_tutorial', 'Tutorials Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:complete_tutorial', 'Cost per Tutorial (MYR)', 'conversions', 'currency', false),
('actions:omni_add_to_wishlist', 'Adds to Wishlist', 'conversions', 'number', false),
('action_values:omni_add_to_wishlist', 'Wishlist Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:omni_add_to_wishlist', 'Cost per Wishlist (MYR)', 'conversions', 'currency', false),
('actions:offsite_conversion.other', 'Other Offline Conversions', 'conversions', 'number', false),
('action_values:offsite_conversion.other', 'Other Offline Conversion Value', 'conversions', 'currency', false),
('cost_per_action_type:offsite_conversion.other', 'Cost per Other Offline Conversion (MYR)', 'conversions', 'currency', false),

-- Shopping
('actions:onsite_web_purchase', 'Direct Website Purchases', 'shopping', 'number', false),
('action_values:onsite_web_purchase', 'Direct Website Purchases Value', 'shopping', 'currency', false),
('actions:onsite_web_app_purchase', 'Shops-assisted Purchases', 'shopping', 'number', false),
('action_values:onsite_web_app_purchase', 'Shops-assisted Value', 'shopping', 'currency', false),

-- Quality & Ranking
('quality_ranking', 'Quality Ranking', 'quality', 'text', false),
('engagement_rate_ranking', 'Engagement Rate Ranking', 'quality', 'text', false),
('conversion_rate_ranking', 'Conversion Rate Ranking', 'quality', 'text', false),

-- Ad Recall
('estimated_ad_recall_rate', 'Estimated Ad Recall Lift Rate', 'recall', 'percentage', false),
('estimated_ad_recallers', 'Estimated Ad Recall Lift (people)', 'recall', 'number', false),
('cost_per_estimated_ad_recallers', 'Cost per Ad Recall Lift (MYR)', 'recall', 'currency', false),

-- Instant Experience
('instant_experience_clicks_to_start', 'Instant Experience Clicks to Start', 'instant_experience', 'number', false),
('instant_experience_clicks_to_open', 'Instant Experience Clicks to Open', 'instant_experience', 'number', false),
('instant_experience_outbound_clicks', 'Instant Experience Outbound Clicks', 'instant_experience', 'number', false),

-- Calls
('actions:click_to_call_native_call_placed', 'Calls Placed', 'calls', 'number', false),
('actions:click_to_call_callback_request_submitted', 'Callback Requests', 'calls', 'number', false),
('actions:click_to_call_native_20s_call_connect', '20s Call Connect', 'calls', 'number', false),
('actions:click_to_call_native_60s_call_connect', '60s Call Connect', 'calls', 'number', false),
('actions:onsite_conversion.messaging_20s_call_connect', 'Messaging 20s Call Connect', 'calls', 'number', false),
('actions:onsite_conversion.messaging_60s_call_connect', 'Messaging 60s Call Connect', 'calls', 'number', false),

-- Mobile App Retention
('actions:mobile_app_retention_d2', 'Mobile App D2 Retention', 'app', 'number', false),
('cost_per_action_type:mobile_app_retention_d2', 'Cost per Mobile App D2 Retention (MYR)', 'app', 'currency', false),
('actions:mobile_app_retention_d7', 'Mobile App D7 Retention', 'app', 'number', false),
('cost_per_action_type:mobile_app_retention_d7', 'Cost per Mobile App D7 Retention (MYR)', 'app', 'currency', false),

-- Group & Other
('actions:group_join', 'Group Joins', 'engagement', 'number', false),
('cost_per_action_type:group_join', 'Cost per Group Join (MYR)', 'engagement', 'currency', false),
('actions:get_directions', 'Get Directions Clicks', 'conversions', 'number', false),
('actions:phone_number_click', 'Phone Number Clicks', 'conversions', 'number', false),
('actions:instagram_profile_visit', 'Instagram Profile Visits', 'engagement', 'number', false),
('actions:ar_effect_share', 'AR Effect Shares', 'engagement', 'number', false),

-- Calculated / Display
('actions:onsite_conversion.lead_grouped', 'Results', 'performance', 'number', false),
('cost_per_action_type:onsite_conversion.lead_grouped', 'Cost per Results (MYR)', 'performance', 'currency', false),
('actions:onsite_conversion.messaging_greeting_started', 'Marketing Messages Read', 'messaging', 'number', false),
('actions:meta_lead_workflow_completion', 'Meta Workflow Completions', 'conversions', 'number', false),
('action_values:meta_lead_workflow_completion', 'Meta Workflow Value', 'conversions', 'currency', false),
('cost_per_action_type:meta_lead_workflow_completion', 'Cost per Meta Workflow (MYR)', 'conversions', 'currency', false),
('actions:onsite_conversion.messaging_buy', 'Meta Message to Buy', 'messaging', 'number', false),
('cost_per_action_type:onsite_conversion.messaging_buy', 'Cost per Meta Message to Buy (MYR)', 'messaging', 'currency', false),
('actions:order_created', 'Orders Created', 'shopping', 'number', false),
('actions:order_dispatched', 'Orders Dispatched', 'shopping', 'number', false),

-- Creative Link Preview
('creative_title', 'Creative Title/Headline', 'creative', 'text', false),
('creative_body', 'Creative Body/Message', 'creative', 'text', false),
('creative_image_url', 'Creative Image URL', 'creative', 'text', false),
('creative_link_url', 'Creative Destination URL', 'creative', 'text', false),
('creative_cta_type', 'Creative CTA Type', 'creative', 'text', false),
('creative_display_link', 'Creative Display Link', 'creative', 'text', false),
('creative_description', 'Creative Description', 'creative', 'text', false),
('creative_video_id', 'Creative Video ID', 'creative', 'text', false),
('creative_thumbnail_url', 'Creative Thumbnail URL', 'creative', 'text', false),
('preview_shareable_link', 'Ad Preview Link', 'creative', 'text', false),

-- In-App Ads
('actions:in_app_ad_click', 'In-App Ad Clicks', 'app', 'number', false),
('actions:in_app_ad_impression', 'In-App Ad Impressions', 'app', 'number', false),
('action_values:in_app_ad_impression', 'In-App Ad Impressions Value', 'app', 'currency', false),
('cost_per_action_type:in_app_ad_click', 'Cost per In-App Ad Click (MYR)', 'app', 'currency', false)

ON CONFLICT (key) DO NOTHING;
