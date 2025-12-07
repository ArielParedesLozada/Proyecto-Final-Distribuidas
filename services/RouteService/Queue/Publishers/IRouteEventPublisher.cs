using RouteService.Queue.Events;

namespace RouteService.Queue.Publishers;

public interface IRouteEventPublisher
{
    Task PublishRouteEndedAsync(string topic, object @event);
}