package com.tti.paveinsight.config;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(CachingConnectionFactory connectionFactory, Jackson2JsonMessageConverter jackson2JsonMessageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jackson2JsonMessageConverter);
        return rabbitTemplate;
    }

    @Bean
    public DirectExchange pciAnalysisExchange() {
        return new DirectExchange("pci-analysis", true, false);
    }

    @Bean
    public Queue pciAnalysisQueue() {
        return new Queue("pci-analysis-queue", true);
    }

    @Bean
    public Queue jobReplyQueue() {
        return new Queue("job-reply-queue", true); // Dedicated reply queue
    }

    @Bean
    public Binding pciAnalysisQueueBinding() {
        return BindingBuilder.bind(pciAnalysisQueue()).to(pciAnalysisExchange()).with("pci-analysis-queue");
    }
}