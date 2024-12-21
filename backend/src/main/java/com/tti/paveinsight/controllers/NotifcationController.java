package com.tti.paveinsight.controllers;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class NotifcationController {
    @MessageMapping("/application")
    @SendTo("/all/messages")
    public String sendNotification(String message){
        System.out.println("message :" + message);
        return message;
    }
}
