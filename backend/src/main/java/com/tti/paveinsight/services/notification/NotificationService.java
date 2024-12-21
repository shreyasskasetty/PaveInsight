package com.tti.paveinsight.services.notification;

import com.tti.paveinsight.models.Job;

public interface NotificationService {
    void sendJobCompletionNotification(Job job);
}
